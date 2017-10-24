'use strict';

const diff3Merge = require('diff3');

// array de documentos armazenado em memória.
const documents = [];

/*
 * Separa as palavras das entradas e realiza merge em relação ao array de
 * palavras.
 * Retorna o conteúdo agregado ou o resultado do diff3 caso seja encontrado
 * um conflito.
 */
const merge = function(a, o, b) {
  a = a.replace(/(\n|\s)+/g,' ').split(' ');
  o = o.replace(/(\n|\s)+/g,' ').split(' ');
  b = b.replace(/(\n|\s)+/g,' ').split(' ');

  let diff3 = diff3Merge(a, o, b);
  let mergedContent = '';

  for (let i = 0; i < diff3.length; ++i)
    if (diff3[i].ok) {
      if (Array.isArray(diff3[i].ok)) {
        mergedContent += diff3[i].ok.join(' ');
      } else if (typeof diff3[i].ok === "string") {
        mergedContent += diff3[i].ok;
      }
    } else {
      return diff3;
    }

  return mergedContent;
}

/*
 * Verifica se o índice de "doc" está no array de documentos.
 * Verifica se o índice da versão base ("base") é válido
 * Caso necessário, faz a união do conteúdo já salvo com o novo.
 * Retorna true em caso de sucesso ou um array descrevendo as diferenças
 * na comparação entre o novo conteúdos e a última versão em relação a base.
 */
const update = function(id, base, author, content) {
  if (!documents[id])
    throw new Error('Documento inexistente.');

  let doc = documents[id];
  let last = doc.versions.length-1;

  if (typeof base === 'number') {
    if (base > last || !doc.versions[base]) {
      throw new Error('Versão base inexistente.');
    } else if (base < last) {
      content = merge(doc.versions[last].content, doc.versions[base].content, content);
    }
  }

  if (typeof content === 'string') {
    let newVersion = {
      version: doc.versions.length,
      author: author,
      content: content,
      date: new Date(),
    }

    doc.versions.push(newVersion);

    return newVersion;
  } else {
    return { conflicts: true, result: content };
  }
};

/*
 * Verifica se o novo documento tem um nome único. Caso positivo,
 * insere um novo registro no array de documentos.
 * Retorna a posição do novo documento no array.
 */
const insert = function(author, name) {
  for (let i = 0; i < documents.length; ++i)
    if (documents[i].name == name)
      throw new Error('O nome já está sendo utilizado para outro documento.');

  let newDoc = {
    id: documents.length,
    author: author,
    name: name,
    date: new Date(),
    versions: []
  }

  documents.push(newDoc);

  return newDoc;
};

/*
 * Retorna as versões de todos os documentos enviados como parâmetro
 */
const versions = function(asked) {
  let values = {};

  for (let i = 0; i < asked.length; ++i) {
    let index = Number(asked[i]);
    let doc = documents[index];
    let last = doc.versions[doc.versions.length-1];

    if (last)
      values[index] = last.version;
  }

  return values;
};

/*
 * Retorna os dados do documento e o conteúdo de sua última versão;
 */
const get = function(id) {
  if (id < 0 || id > documents.length-1)
    throw new Error("Documento inexistente.");

  let doc = documents[id];

  return {
    id: doc.id,
    author: doc.author,
    name: doc.name,
    date: doc.date,
    last: doc.versions[doc.versions.length-1]
  }
}

/*
 * Retorna uma lista de documentos salvos em memória
 */
const list = function() {
  return documents.map(function(value, index) {
    return {
      id: value.id,
      name: value.name
    };
  });
};

module.exports = {
  update: update,
  insert: insert,
  versions: versions,
  get: get,
  list: list,
}