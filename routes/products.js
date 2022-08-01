const express = require("express");
const router = express.Router();

// Import in the Product model
const { Product, Category, Tag } = require('../models'); // Can omit index.js since that is the default file that NodeJS will look for
const { createProductForm, createSearchForm, bootstrapField } = require('../forms');
const { checkIfAuthenticated } = require('../middlewares');

router.get("/", async function (req, res) {
  // Fetch all the products
  // use the bookshelf syntax
  // -> select * from products
  // plus joining category tbale

  // Previous code (without search engine)
  // let products = await Product.collection().fetch({
  //   withRelated: ['category', 'tags']
  // });

  // Fetch all the categories in the system
  // map to an array format for caolan form select dropdown options
  const categories = await Category.fetchAll().map(category => {
    return [category.get('id'), category.get('name')]
  })

  // Put at start of array (for search all category option)
  categories.unshift([0, '--- Any category ---']);

  // Fetch all tags
  const tags = await Tag.fetchAll().map(tag => {
    return [tag.get('id'), tag.get('name')]
  })

  // Create a search engine:
  // Create instance of the search form
  const searchForm = createSearchForm(categories, tags);

  // Create a query builder
  let query = Product.collection(); // This creates a query builder

  // Search engine logic: (using Knex query builder)
  searchForm.handle(req, {
    success: async function (form) {
      // If user provide query for name
      if (form.data.name) {
        query.where('name', 'like', `%${form.data.name}%`);
      }

      if (form.data.min_cost) {
        query.where('cost', '>=', form.data.min_cost);
      }

      if (form.data.max_cost) {
        query.where('cost', '<=', form.data.max_cost);
      }

      if (form.data.category_id && form.data.category_id !== '0') {
        query.where('category_id', '=', form.data.category_id);
      }

      // Need to perform join to get the tags of each product (pivot table products_tags)
      if (form.data.tags) {
        // First arg: SQL clause
        // second arg: which table
        // third arg: one of the keys
        // fourth arg: the key to join with
        // Eqv: SELECT * FROM products JOIN products_tags ON products.id = products_id where tag_id IN (<selected tags ID>)
        // NOTE: THIS METHOD SEARCH FOR 'OR' NOT 'AND'
        // -> DOING 'AND' IS HARD SINCE REQUIRES SUB-QUERIES
        query.query('join', 'products_tags', 'products.id', 'product_id').where('tag_id', 'in', form.data.tags.split(','))
      }

      const products = await query.fetch({
        withRelated: ['category', 'tags']
      })

      res.render("products/index", {
        products: products.toJSON(),
        form: form.toHTML(bootstrapField) // Note that this is form not searchForm so that user can see the query
      });
    },
    empty: async function (form) {
      const products = await query.fetch({
        withRelated: ['category', 'tags']
      })

      res.render("products/index", {
        products: products.toJSON(),
        form: searchForm.toHTML(bootstrapField)
      });
    },
    error: async function (form) {

    }
  })

  // Previous code before search engine
  // const products = await query.fetch({
  //   withRelated: ['category', 'tags']
  // })

  // res.render("products/index", {
  //   products: products.toJSON(),
  //   form: searchForm.toHTML(bootstrapField)
  // });
});

router.get("/create", checkIfAuthenticated, async function (req, res) {
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
    form: productForm.toHTML(bootstrapField),
    // Pass cloudinary info to hbs file for use in JS block
    cloudinaryName: process.env.CLOUDINARY_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryPreset: process.env.CLOUDINARY_UPLOAD_PRESET
  })
});

router.post('/create', checkIfAuthenticated, async function (req, res) {
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
      product.set('image_url', form.data.image_url)
      product.set('thumbnail_url', form.data.thumbnail_url)

      // MUST REMEMBER TO SAVE (async)
      await product.save();

      if (form.data.tags) {
        // form.data.tags will contain the IDs of the selected tags separated by comma
        // eg. "1,3"
        await product.tags().attach(form.data.tags.split(','))
      }

      // req.flash is available because we did app.use(flash()) inside index.js
      req.flash('success_messages', `New product ${product.get('name')} has been created`)
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

router.get('/:product_id/update', checkIfAuthenticated, async function (req, res) {
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
  productForm.fields.image_url.value = product.get('image_url'); // hidden form field

  // fill in the multi-select for tags
  // product.related('tags') will return an array of tag objects
  let selectedTags = await product.related('tags').pluck('id');
  productForm.fields.tags.value = selectedTags;

  res.render('products/update', {
    'form': productForm.toHTML(bootstrapField),
    'product': product.toJSON(),
    // Pass cloudinary info to hbs file for use in JS block
    'cloudinaryName': process.env.CLOUDINARY_NAME,
    'cloudinaryApiKey': process.env.CLOUDINARY_API_KEY,
    'cloudinaryPreset': process.env.CLOUDINARY_UPLOAD_PRESET
  })
})

router.post('/:product_id/update', checkIfAuthenticated, async function (req, res) {
  console.log(req.body)
  // 1. Get the product that is being updated
  // -> SELECT * FROM products WHERE product_id = <req.params.product_id> 
  const product = await Product.where({
    'id': req.params.product_id
  }).fetch({
    withRelated: ['tags'],
    require: true // if not found will cause an exception/error (need to surround with try catch in real life)
  })

  // Fetch all the categories in the system
  // map to an array format for caolan form select dropdown options
  const categories = await Category.fetchAll().map(category => {
    return [category.get('id'), category.get('name')]
  })

  const tags = await Tag.fetchAll().map(tag => {
    return [tag.get('id'), tag.get('name')]
  })

  const productForm = createProductForm(categories, tags);

  // Handle function will run the validation on the data
  productForm.handle(req, {
    success: async function (form) {
      // the form arg contains what the user has typed into the form
      // update products set name = ? , cost = ?, description = ? where product_id = ?
      // product.set('name', form.data.name)
      // product.set('cost', form.data.cost)
      // product.set('description', form.data.description)
      // product.set('category_id', form.data.category_id)
      // product.set('image_url', form.data.image_url)

      let { tags, ...productData } = form.data;
      product.set(productData); // for the shortcut to work, all the keys in form.data object must be a column name in the table
      await product.save();

      // get all the selected tags as an array
      let tagIds = tags.split(',').map(id => parseInt(id))
      let existingTagIds = await product.related('tags').pluck('id'); // get an array that contains the ids of the existing tags

      // More efficient way
      // remove all the current tags that are not selected anymore
      let toRemove = existingTagIds.filter(id => tagIds.includes(id) === false)

      await product.tags().detach(toRemove);

      // add in all the tags from the form that are not in the product
      await product.tags().attach(tagIds);

      // Easier to implement but less efficient
      // await product.tags().detach(existingTagIds);
      // await product.tags().attach(tagIds);

      res.redirect('/products');
    },
    error: async function (form) {
      res.render('products/update', {
        product: product.toJSON(),
        form: form.toHTML(bootstrapField)
      })
    },
    empty: async function (form) {
      res.render('products/update', {
        'product': product.toJSON(),
        'form': form.toHTML(bootstrapField)
      })
    }
  })

})

router.get('/:product_id/delete', checkIfAuthenticated, async function (req, res) {
  const product = await Product.where({
    'id': req.params.product_id
  }).fetch({
    require: true
  })

  res.render('products/delete', {
    product: product.toJSON()
  })
})

router.post('/:product_id/delete', checkIfAuthenticated, async function (req, res) {
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
