const express = require("express");
const router = express.Router();

// Import in the Product model
const { Product, Category, Tag } = require('../models'); // Can omit index.js since that is the default file that NodeJS will look for
const { createProductForm, bootstrapField } = require('../forms');

router.get("/", async function (req, res) {
  // Fetch all the products
  // use the bookshelf syntax
  // -> select * from products
  // plus joining category tbale
  let products = await Product.collection().fetch({
    withRelated: ['category', 'tags']
  });
  res.render("products/index", {
    products: products.toJSON()
  });
});

router.get("/create", async function (req, res) {
  // Fetch all the categories in the system
  // map to an array format for caolan form select dropdown options
  const categories = await Category.fetchAll().map(category => {
    return [category.get('id'), category.get('name')]
  })

  const tags = await Tag.fetchAll().map(tag => {
    return [tag.get('id'), tag.get('name')]
  })

  // Create an instance of form
  const productForm = createProductForm(categories, tags);
  res.render('products/create', {
    // Get a HTML version of the form formatted using bootstrap field function
    form: productForm.toHTML(bootstrapField)
  })
});

router.post('/create', async function (req, res) {
  // Fetch all the categories in the system
  // map to an array format for caolan form select dropdown options
  const categories = await Category.fetchAll().map(category => {
    return [category.get('id'), category.get('name')]
  })

  const productForm = createProductForm(categories);
  productForm.handle(req, {
    'success': async function (form) {
      // success function is called when there is no validation error
      // the form argument contains what the user has typed in (form.data instead of req.body)

      // we need to do the eqv. of INSERT INTO products (name, description, cost) VALUES (form.data.name, form.data.description, form.data.cost)

      // the MODEL represents the table
      // ONE instance of the MODEL represents a row
      const product = new Product(); // create a new instance of the Product model
      product.set('name', form.data.name)
      product.set('description', form.data.description)
      product.set('cost', form.data.cost)
      product.set('category_id', form.data.category_id)

      // MUST REMEMBER TO SAVE (async)
      await product.save();

      if (form.data.tags) {
        // form.data.tags will contain the IDs of the selected tags separated by comma
        // eg. "1,3"
        await product.tags().attach(form.data.tags.split(','))
      }

      res.redirect('/products')
    },
    'error': function (form) {
      // the error function is called if the form has validation error
      res.render('products/create', {
        form: form.toHTML(bootstrapField)
      })
    },
    'empty': function (form) {
      // the empty function is called if the form is not filled in at all
      res.render('products/create', {
        form: form.toHTML(bootstrapField)
      })
    }
  })
})

// router.get('/:product_id/update', async function (req, res) {
//   // 1. Get the product that is being updated
//   // -> SELECT * FROM products WHERE product_id = <req.params.product_id> 
//   const product = await Product.where({
//     'id': req.params.product_id
//   }).fetch({
//     require: true // if not found will cause an exception/error (need to surround with try catch in real life)
//   })

//   // 2. Create the form to update the product
//   const productForm = createProductForm();
//   // 3. Fill the form with the previous values of the product
//   productForm.fields.name.value = product.get('name');
//   productForm.fields.cost.value = product.get('cost');
//   productForm.fields.description = product.get('description');

//   res.render('products/update', {
//     form: productForm.toHTML(bootstrapField),
//     product: product.toJSON()
//   })
// })

router.get('/:product_id/update', async function (req, res) {
  // 1. get the product that is being updated
  // select * from products where product_id = <req.params.product_id>
  const product = await Product.where({
    'id': req.params.product_id
  }).fetch({
    withRelated: ['tags'], // fetch all the tags associated with the product
    require: true  // if not found will cause an exception (aka an error)
  })
  // 2. create the form to update the product
  // Fetch all the categories in the system
  // map to an array format for caolan form select dropdown options
  const categories = await Category.fetchAll().map(category => {
    return [category.get('id'), category.get('name')]
  })

  const tags = await Tag.fetchAll().map(tag => {
    return [tag.get('id'), tag.get('name')]
  })

  const productForm = createProductForm(categories, tags);
  // 3. fill the form with the previous values of the product
  productForm.fields.name.value = product.get('name');
  productForm.fields.cost.value = product.get('cost');
  productForm.fields.description.value = product.get('description');
  productForm.fields.category_id.value = product.get('category_id');

  // fill in the multi-select for tags
  // product.related('tags') will return an array of tag objects
  let selectedTags = await product.related('tags').pluck('id');
  productForm.fields.tags.value = selectedTags;

  res.render('products/update', {
    'form': productForm.toHTML(bootstrapField),
    'product': product.toJSON()

  })
})

router.post('/:product_id/update', async function (req, res) {
  // 1. Get the product that is being updated
  // -> SELECT * FROM products WHERE product_id = <req.params.product_id> 
  const product = await Product.where({
    'id': req.params.product_id
  }).fetch({
    withRelated:['tags'],
    require: true // if not found will cause an exception/error (need to surround with try catch in real life)
  })

  // Fetch all the categories in the system
  // map to an array format for caolan form select dropdown options
  const categories = await Category.fetchAll().map(category => {
    return [category.get('id'), category.get('name')]
  })

  const productForm = createProductForm(categories);

  // Handle function will run the validation on the data
  productForm.handle(req, {
    success: async function (form) {
      // the form arg contains what the user has typed into the form
      // update products set name = ? , cost = ?, description = ? where product_id = ?
      // product.set('name', form.data.name)
      // product.set('cost', form.data.cost)
      // product.set('description', form.data.description)
      // product.set('category_id', form.data.category_id)

      let { tags, ...productData } = form.data;
      product.set(productData); // for the shortcut to work, all the keys in form.data object must be a column name in the table
      await product.save();

      // get all the selected tags as an array
      let tagIds = tags.split(',').map(id => parseInt(id))
      let existingTagIds = await product.related('tags').pluck('id'); // get an array that contains the ids of the existing tags

      // More efficient way
      // remove all the current tags that are not selected anymore
      let toRemove = existingTagIds.filter( id => tagIds.includes(id) === false)

      await product.tags().detach(toRemove);

      // add in all the tags from the form that are not in the product
      await product.tags().attach(tagIds);

      // Easier to implement but less efficient
      // await product.tags().detach(existingTagIds);
      // await product.tags().attach(tagIds);

      res.redirect('/products');
    },
    error: async function (form) {
      res.render('/products/update', {
        product: product.toJSON(),
        form: form.toHTML(bootstrapField)
      })
    },
    empty: async function (form) {

    }
  })

})

router.get('/:product_id/delete', async function (req, res) {
  const product = await Product.where({
    'id': req.params.product_id
  }).fetch({
    require: true
  })

  res.render('products/delete', {
    product: product.toJSON()
  })
})

router.post('/:product_id/delete', async function (req, res) {
  const product = await Product.where({
    'id': req.params.product_id
  }).fetch({
    require: true
  })

  await product.destroy();

  res.redirect('/products')
})

// Export router function
module.exports = router;
