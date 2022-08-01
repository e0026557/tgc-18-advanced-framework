// Require in caolan-forms
const forms = require('forms');

// Create some shortcuts
const fields = forms.fields;
const validators = forms.validators;
const widgets = forms.widgets;

// Allow of styling of forms using Bootstrap
const bootstrapField = function (name, object) {
  if (!Array.isArray(object.widget.classes)) { object.widget.classes = []; }

  if (object.widget.classes.indexOf('form-control') === -1) {
    object.widget.classes.push('form-control');
  }

  var validationclass = object.value && !object.error ? 'is-valid' : '';
  validationclass = object.error ? 'is-invalid' : validationclass;
  if (validationclass) {
    object.widget.classes.push(validationclass);
  }

  var label = object.labelHTML(name);
  var error = object.error ? '<div class="invalid-feedback">' + object.error + '</div>' : '';

  var widget = object.widget.toHTML(name, object);
  return '<div class="form-group">' + label + widget + error + '</div>';
};

// This function will return an instance of the create product form
const createProductForm = (categories, tags) => {
  // each key/value pair in the object represents one form control
  return forms.create({
    'name': fields.string({
      required: true,
      errorAfterField: true,
    }),
    'cost': fields.string({
      required: true,
      errorAfterField: true,
      validators: [validators.integer(), validators.min(0)]
    }),
    'description': fields.string({
      required: true,
      errorAfterField: true
    }),
    'category_id': fields.string({
      label: 'Category',
      required: true,
      errorAfterField: true,
      // array of array, where the inner array represents an option [value, display value shown to users]
      choices: categories,
      widget: widgets.select()
    }),
    'tags': fields.string({
      required: true,
      errorAfterField: true,
      widget: widgets.multipleSelect(),
      choices: tags
    }),
    // <input type='hidden' />
    image_url: fields.string({
      widget: widgets.hidden()
    }),
    // <input type='hidden' />
    thumbnail_url: fields.string({
      widget: widgets.hidden()
    }),
  })
}

const createUserForm = function () {
  return forms.create({
    username: fields.string({
      required: true,
      errorAfterField: true
    }),
    email: fields.string({
      required: true,
      errorAfterField: true
    }),
    password: fields.password({
      required: true,
      errorAfterField: true
    }),
    confirm_password: fields.password({
      required: true,
      errorAfterField: true,
      // Ensure that the value for confirm_password matches that of the password field
      validators: [validators.matchField('password')]
    })
  })
}

const createLoginForm = function () {
  return forms.create({
    email: fields.string({
      required: true,
      errorAfterField: true
    }),
    password: fields.password({
      required: true,
      errorAfterField: true
    })
  })
}

const createSearchForm = function (categories, tags) {
  return forms.create({
    name: fields.string({
      required: false, // not necessary to search by name
      errorAfterField: true
    }),
    // Note that the data will still be received as string
    min_cost: fields.number({
      required: false,
      errorAfterField: true,
      validators: [validators.integer()]
    }),
    max_cost: fields.number({
      required: false,
      errorAfterField: true,
      validators: [validators.integer()]
    }),
    category_id: fields.string({
      label: 'Category',
      required: false,
      errorAfterField: true,
      choices: categories,
      widget: widgets.select()
    }),
    tags: fields.string({
      required: false,
      errorAfterField: true,
      choices: tags,
      widget: widgets.multipleSelect()
    })
  })
}

module.exports = { createProductForm, createUserForm, createLoginForm, createSearchForm, bootstrapField };