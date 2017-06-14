'use strict';

const console = require('console');
const db = require('../lib/db');
let validator = require('../lib/validator');
// const DrSax = require('dr-sax');
// const drsax = new DrSax({stripTags: true});


class Base {



  /**
   * Set the Model data
   *
   * @param  {Object} data The Models data
   * @return {void}
   */
  constructor(data) {
    this._data = data || {};
  }



  /**
   * Get the class name
   *
   * @return {string} The name of the Model
   */
  myName() {
 return this.constructor.name.toLowerCase();
}


  /**
   * Getters and Setters
   */
  get(key) {
 return this._data[key];
}
  set(key, value) {
 this._data[key] = value; return value;
}
  has(key) {
 return this._data.hasOwnProperty(key);
}
  remove(key) {
 delete this._data[key];
}
  getAll() {
 return this._data;
}



  /**
   * Save the model by creating it or updating it
   *
   * @param  {Function} cb The callback on saved
   * @return {void}
   */
  save(cb) {
    this.validate(function (invalid) {
      if (invalid) return cb(invalid);

      if (this.doUpdate()) {
        this._update(cb);
      } else {
        this._create(cb);
      }
    }.apply(this));
  }

  // Each model needs to implement their own
  doUpdate() {
 return false;
}


  /**
   * Validate the data before save
   *
   * @param  {Function} callback The callback
   * @return {void}              Callback with error if invalid
   */
  validate(callback) {

    validator
      .async( this._data, this.schema )
      .then(
        function () {
 callback(null);
},
        function (e) {
          if (e instanceof Error) {
            console.err('Validation exception error: ', e);
          }
          callback(e);
        }
      );
  }





  /**
   * Sanitize all the data in an object
   *
   * @param  {object} data The object to sanitize the data
   * @return {object}      The object sanitized
   */
  // sanitize(data) {
  //   for(let key in data) {
  //     if( typeof data[key] === 'object' ){
  //       data[key] = this.sanitize(data[key]);
  //     }else{
  //       if(typeof data[key] === 'string') {
  //         data[key] = drsax.write(data[key].trim());
  //       }
  //     }
  //   }
  //   return data;
  // }



  /*==================================================*\

    Static methods

  \*==================================================*/


  /**
   * Verify that the language exist else default
   *
   * @param  {string} lang The language (short 2-letter)
   * @return {string}      A valid language string (2-letter)
   */
  static getLanguage(lang) {
    if (this.languages.indexOf(lang) >= 0) return lang;
    return this.defaultLanguage;
  }



  /**
   * Convert a Model to a JSON object
   *
   * @param  {Model|Array} post   A model or an array with models
   * @return {Object}        The models data
   */
  toJson(model) {
    return Base.toJson(model || this);
  }
  static toJson(model) {

    // If there is an array with posts loop through all
    if (Array.isArray(model)) {
      let self = this;
      return model.map(function (m) {
        return self.toJson(m);
      });
    }

    // If there is any guarded items don't let them through
    if (model.output && model.output.length) {
      let model_out = {};
      for (let i = 0; i < model.output.length; i++) {
        if (model._data[model.output[i]] !== undefined) {
          model_out[model.output[i]] = model._data[model.output[i]];
        }
      }
      return model_out;
    }

    return model._data;
  }


  toJsonFields(fields) {
    let output = {};
    for (let i = 0; i < fields.length; i++) {
      if (this._data[fields[i]] !== undefined) {
        output[fields[i]] = this._data[fields[i]];
      }
    }
    return output;
  }

}



/*==================================================*\

  Variables

\*==================================================*/

Base.defaultLanguage = 'en';
Base.languages = ['en', 'fr'];



Base.db = function () {
  return db;
};



module.exports = Base;
