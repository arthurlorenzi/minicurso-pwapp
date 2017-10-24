(function(){
  'use strict';

  // "identificador" desse cliente
  const MY_ID = Math.floor(Math.random() * 100000);
  const SERVER_URL = 'http://localhost:3000/';

  console.log("[ID do cliente]:" + MY_ID);

  // alguns componentes ficarão cacheados
  const layout = document.querySelector('.mdl-layout');
  const main = document.querySelector('main');
  const spinner = document.getElementById('spinner');
  const snackbar = document.getElementById('snackbar');
  const home = document.getElementById('home');
  const dialog = document.querySelector('dialog');
  const insertName = document.getElementById('insert-name');
  const insertError = document.getElementById('insert-error-message');
  const docsNavigation = document.getElementById('docs-navigation');
  const templ = document.getElementById('document-template');

  const notifications = {};
  const versions = {};
  const notifiedVersions = {};

  const app = {
    /*
     * Inicia o app, atribuindo os eventos aos elementos de interface e
     * fazendo as consultas necessárias ao servidor
     */
    init: function() {
      app.getDocumentList();
      // starts polling
      app.poll();
    },

    /*
     * Função que faz HTTP polling para verificar periodicamente no servidor se
     * algum documento foi atualizado. Essa função só foi utilizada para
     * exemplificar a funcionalidade, em situações reais deve-se usar WebSockets,
     * Long polling ou Server Side Events.
     */
    poll: function() {
      setTimeout(function() {
        let list = [];

        for (let doc in notifications)
          if (notifications[doc]) list.push(doc);

        if (list.length > 0 && navigator.onLine) {
          let url = SERVER_URL + 'observe?documents=' + list.join(',');
          let request = new XMLHttpRequest();

          request.onreadystatechange = function() {
            if (request.readyState === XMLHttpRequest.DONE) {
              if (request.status === 200) {
                let response = JSON.parse(request.response);

                for (let doc in response) {
                  if (notifiedVersions[doc] < response[doc]) {
                    let data = { message: 'Outro usuário modificou documento ' + doc + '.' };
                    snackbar.MaterialSnackbar.showSnackbar(data);
                    notifiedVersions[doc] = response[doc];
                  }
                }

                app.poll();
              }
            }
          };
          request.open('GET', url);
          request.send();
        } else {
          app.poll();
        }
      }, 20000);
    },

    /*
     * Requisita ao servidor uma lista de todos os documentos salvos. Ao receber
     * a lista, controi a navegação para esses documentos.
     */
    getDocumentList: function() {
      let url = SERVER_URL + 'list';
      let request = new XMLHttpRequest();

      if ('caches' in window) {
        caches.match(url).then(function(res) {
          if (res) {
            res.json().then(json => {
              let list = json.list;

              for (let i = 0; i < list.length; ++i) {
                let doc = list[i];
                app.buildDocumentNav(doc.id, doc.name);
              }
            })
          }
        });
      }

      request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status === 200) {
            let list = JSON.parse(request.response).list;

            for (let i = 0; i < list.length; ++i) {
              let doc = list[i];
              app.buildDocumentNav(doc.id, doc.name);
            }
          }
        }
      };
      request.open('GET', url);

      if (navigator.onLine)
        request.send();
    },

    /*
     * Requisita ao servidor a criação de um novo arquivo com o nome recebido
     * por parâmetro. O campo nome é marcado como inválido.
     */
    createDocument: function(name) {
      let url = SERVER_URL + 'create';
      let request = new XMLHttpRequest();

      request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status === 200) {
            let response = JSON.parse(request.response);

            if (response.status === "error") {
              insertName.parentElement.className += ' is-invalid';
              insertError.innerHTML = response.message;
              insertError.style.display = 'block';
            } else {
              insertName.parentElement.className.replace(' is-invalid', '');
              insertName.value = '';
              insertError.style.display = 'none';

              dialog.close();
              app.buildDocumentNav(response.id, name);
              app.openDocument(response.id);
            }
          }
        }
      };
      request.open('POST', url);
      request.setRequestHeader("Content-Type", "application/json");

      if (navigator.onLine) {
        request.send(JSON.stringify({ name: name, author: MY_ID }));
      } else {
        let data = { message: 'Não foi possível se conectar ao servidor.' };
        snackbar.MaterialSnackbar.showSnackbar(data);
      }
    },

    /*
     * Requisita ao servidor a abertura de um documento. Caso o documento exista
     * delega o resultado para setupDocumentPage
     */
    openDocument: function(id) {
      home.style.display = 'none';
      spinner.style.display = 'block';
      main.parentElement.appendChild(home);

      let url = SERVER_URL + 'get?document=' + id;
      let request = new XMLHttpRequest();

      if ('caches' in window) {
        caches.match(url).then(function(res) {
          if (res) {
            res.json().then(response => {
              if (response.status === "error") {
                console.error(response.message);
              } else {
                versions[response.id] = (response.last) ? response.last.version : -1;
                notifiedVersions[response.id] = versions[response.id];
                app.setupDocumentPage(response);
              }
            })
          } else {
            spinner.style.display = 'none';
            app.goToHome();
            let data = { message: 'Não foi possível carregar o documento.' };
            snackbar.MaterialSnackbar.showSnackbar(data);
          }
        });
      }

      request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status === 200) {
            let response = JSON.parse(request.response);

            if (response.status === "error") {
              console.error(response.message);
            } else {
              versions[response.id] = (response.last) ? response.last.version : -1;
              notifiedVersions[response.id] = versions[response.id];
              app.setupDocumentPage(response);
            }
          }
        }
      };
      request.open('GET', url);

      if (navigator.onLine)
        request.send();
    },

    /*
     * Requisita a atualização do conteúdo de um documento ao servidor.
     * Caso não seja possível atualizar devido a um conflito, o usuário
     * é notificado.
     */
    updateDocument: function(id, content) {
      let base = versions[id];
      let url = SERVER_URL + 'update';
      let request = new XMLHttpRequest();

      request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status === 200) {
            let response = JSON.parse(request.response);

            if (response.status == "error") {
              console.error(response.message);
            } else if (response.conflicts) {
              let data = { message: 'Conteúdo conflita com o da nuvem.' };
              snackbar.MaterialSnackbar.showSnackbar(data);
            } else {
              versions[id] = response.version;
              notifiedVersions[id] = versions[id];
              document.getElementById('content').value = response.content;
            }
          }
        }
      };
      request.open('POST', url);
      request.setRequestHeader("Content-Type", "application/json");
      if (navigator.onLine) {
        request.send(JSON.stringify({ document: Number(id), base: base, author: MY_ID, content }));
      } else {
        let data = { message: 'Não foi possível se conectar ao servidor.' };
        snackbar.MaterialSnackbar.showSnackbar(data);
      }
    },

    /*
     * Função que registra os listeners para os eventos principais do app
     */
    initUI: function() {
      /*
       * Listeners para UI
       */
      document.getElementById('fab-add-document').addEventListener('click', function() {
        // abre o modal de inclusão do nome do novo arquivo
        dialog.showModal();
      });

      dialog.querySelector('.close').addEventListener('click', function() {
        // fecha o modal de inclusão do nome do novo arquivo clicando em "Cancelar"
        dialog.close();
      });

      dialog.querySelector('.create').addEventListener('click', function() {
        app.createDocument(insertName.value);
      });

      insertName.addEventListener('keypress', function(e) {
        insertError.innerHTML = '';

        if (e.keyCode === 13)
          app.createDocument(this.value);
      });

      document.getElementById('home-anchor').addEventListener('click', function() {
        app.goToHome();
        layout.MaterialLayout.toggleDrawer();
      });
    },

    /*
     * Abre a página inicial
     */
    goToHome: function() {
      if (home.parentElement !== main) {
        app.clearMain();
        main.appendChild(home);
        home.style.display = 'block';
      }
    },

    /*
     * Remove todos os elementos do container principal
     */
    clearMain: function() {
      while (main.firstChild) {
        main.removeChild(main.firstChild);
      }
    },

    /*
     * Constrói um link de navegação para um documento no drawer (barra lateral)
     */
    buildDocumentNav: function(id, name) {
      let previous = docsNavigation.querySelector('a[doc-id="' + id + '"]');

      if (!previous) {
        let newAnchor = document.createElement('a'),
          text = document.createTextNode(name);

        newAnchor.append(text);
        newAnchor.setAttribute('class', 'mdl-navigation__link');
        newAnchor.setAttribute('doc-id', id);

        newAnchor.addEventListener('click', function() {
          layout.MaterialLayout.toggleDrawer();
          app.openDocument(id);
        })

        docsNavigation.append(newAnchor);
      }
    },

    /*
     * Constrói a página de um documento e atribui os eventos de UI.
     */
    setupDocumentPage: function(data) {
      app.clearMain();
      templ.content.querySelector('.name').innerHTML = data.name;
      templ.content.querySelector('.author').innerHTML = 'autor: ' + data.author;
      templ.content.querySelector('.date').innerHTML = 'criado em: ' + (new Date(data.date)).toLocaleDateString();

      if (data.last)
        templ.content.querySelector('#content').value = data.last.content;

      let templateBell = templ.content.getElementById('notification-bell');
      templateBell.setAttribute('doc-id', data.id);

      if (notifications[data.id])
        templateBell.querySelector('i').innerHTML = 'notifications_active';

      spinner.style.display = 'none';
      main.appendChild(document.importNode(templ.content, true));

      let form = document.getElementById('content-form');
      let input = document.getElementById('content');
      let submit = document.getElementById('submit');
      let bell = document.getElementById('notification-bell');
      
      componentHandler.upgradeElement(input.parentElement);
      componentHandler.upgradeElement(submit);

      /*
       * Listeners para UI
       */
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        return false;
      })

      bell.addEventListener('click', function() {
        let id = this.getAttribute('doc-id');

        if (notifications[id]) {
          notifications[id] = false;
          this.querySelector('i').innerHTML = 'notifications_none';
        } else {
          notifications[id] = true;
          this.querySelector('i').innerHTML = 'notifications_active';
        }
      });

      submit.addEventListener('click', function() {
        app.updateDocument(data.id, input.value);
      });
    }

  };

  app.initUI();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(function() {
        app.init();
      })
      .catch(function() {
        console.log("[Falha ao registrar o SW]");
        app.init();
      })
  } else {
    app.init();
  }

})();