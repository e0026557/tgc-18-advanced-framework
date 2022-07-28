// Require in caolan-forms
const forms = require('forms');
const { widgets } = require('forms/lib/forms');

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
const createProductForm = (categories) => {
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
      })
  })
}

module.exports = { createProductForm, bootstrapField};