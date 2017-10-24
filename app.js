'use strict';

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// rotas
const observe = require('./routes/observe');
const index = require('./routes/index');
const get = require('./routes/get');
const list = require('./routes/list');
const create = require('./routes/create');
const update = require('./routes/update');

// app
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// arquivos staticos
app.use(express.static(path.join(__dirname, 'public')));

app.use('/observe', observe);
app.use('/', index);
app.use('/get', get);
app.use('/list', list);
app.use('/create', create);
app.use('/update', update);

module.exports = app;
