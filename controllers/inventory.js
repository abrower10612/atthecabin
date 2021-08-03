const Inventory = require('../models/inventory');
const Cabin = require('../models/property');

exports.getInventory = (req, res, next) => {
  const propertyId = req.params.propertyId
  Inventory.findOne({
      propertyId: propertyId
    })
    .then(inventory => {
      Cabin.findById(propertyId)
      .then(property => {
        res.render('inventory/inventory', {
          inventory: inventory,
          pageTitle: 'Inventory',
          path: '/inventory/inventory',
          propertyId: propertyId,
          name: property.name,
          location: property.location
        })
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUserInventory = (req, res, next) => {
  const propertyId = req.params.propertyId
  Inventory.findOne({
      propertyId: propertyId
    })
    .then(inventory => {
      Cabin.findById(propertyId)
        .then(property => {
          res.render('inventory/inventory-user', {
            inventory: inventory,
            pageTitle: 'Inventory',
            path: '/inventory/inventory',
            propertyId: propertyId,
            name: property.name,
            location: property.location
          })
        })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

exports.addInventory = (req, res, next) => {
  const propertyId = req.body.propertyId; 
  const updateinventoryList = req.body.inventory;
  let updateAmount = req.body.amount;

  if (!updateinventoryList) {
    return res.redirect('/inventory/inventory/' + propertyId)
  }
  if (!updateAmount) {
    updateAmount = 0;
  }
  Inventory.findOne({
      propertyId: propertyId
    })
    .then(inventory => {
      if (!inventory) {
        const inv = new Inventory({
          list: [{description: updateinventoryList, amount: updateAmount }],
          propertyId: propertyId
        })
        inv.save();
        return res.redirect('/inventory/inventory/' + propertyId);
      } else {
        inventory.list.push({description: updateinventoryList, amount: updateAmount });
        return inventory.save()
        .then(result => {
          return res.redirect('/inventory/inventory/' + propertyId);
        })
      }
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteInventory = (req, res, next) => {
  console.log("we made it to delete!")
  const propertyId = req.query.propertyId; 
  const itemToDelete = req.query.itemId;
  console.log(itemToDelete)
  Inventory.findOne({
      propertyId: propertyId
    })
    .then(inventory => {
      var index
      for (i = 0; i < inventory.list.length; i++) {
        if (inventory.list[i]._id == itemToDelete) {
            index = i
        }
      }
      if (index > -1) {
        inventory.list.splice(index, 1);
      }
      console.log("right after " + index)
      return inventory.save()
        .then(result => {
          return res.redirect('/inventory/inventory/' + propertyId);
        })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateInventory = (req, res, next) => {
  const item = req.body.item;
  const amount = req.body.amount;
  const itemId = req.body.itemId;
  const propertyId = req.body.propertyId;
  const newList = [];
  if (Array.isArray(item)) {
    for(let i = 0; i < item.length; i++) {
      newList.push({ 
        description: item[i],
        amount: amount[i],
        _id: itemId[i]
      })
    }
  } else {
    newList.push({ 
      description: item,
      amount: amount,
      _id: itemId
    })
  }
  Inventory.findOne({ propertyId: propertyId })
    .then(inventory => {
      inventory.list = newList;
      return inventory.save()
      .then(results => {
        return res.redirect('/inventory/inventory/' + propertyId);
      })
  })
  .catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
};

exports.updateUserInventory = (req, res, next) => {
  const newAmount = req.body.amount;
  const itemId = req.body.itemId;
  const propertyId = req.body.propertyId;
  const list = [];
  Inventory.findOne({ propertyId: propertyId })
    .then(inventory => {
      if(Array.isArray(newAmount)) {
        for (var i = 0; i < inventory.list.length; i++) {
          inventory.list[i].amount = newAmount[i];
        }
      } else {
        inventory.list[0].amount = newAmount;
      }
      return inventory.save()
      .then(results => {
        return res.redirect('/inventory/user-update/' + propertyId);
      })
  })
  .catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
};

exports.getAdminProperties = (req, res, next) => {
  const address = '/inventory/inventory/'
  Cabin
    .find({
      admins: req.session.user._id
    })
    .then(properties => {
      // if 0 or more than 1 property, route to properties page for selection
      // this will need to route to a page for the admin to edit the property
      if (properties.length !== 1) {
        res.render('properties', {
          pageTitle: 'Property List',
          path: '/properties',
          currentUser: req.session.user._id,
          isAdmin: true,
          isAuthenticated: req.session.isLoggedIn,
          properties: properties,
          address: address
        });
      } else {
        // if only one property, automatically route to add reservation page
        // will need to be updated with correct route after routes set up
        res.redirect('../inventory/inventory/' + properties[0]._id);
      }

    })
};

exports.getUserProperties = (req, res, next) => {
  const address = '/inventory/user-update/' 
  Cabin
      .find({ 
        $or: [{members: req.session.user._id},
          { admins: req.session.user._id }]
      })
      .then(properties => {
        // if 0 or more than 1 property, route to properties page for selection
        if(properties.length !== 1) {
          res.render('properties', {
            pageTitle: 'Property List',
            path: '/',        
            currentUser: req.session.user._id,
            isAdmin: false,
            isAuthenticated: req.session.isLoggedIn,
            properties: properties,
            address: address
          });
        } else {
          // if only one property, automatically route to add reservation page
          // will need to be updated with correct route after routes set up
          res.redirect('../inventory/user-update/' + properties[0]._id);
        }
        
      })
    .catch(err => {
        const error = new Error(err);
        error.statusCode = 500;
        next(error);
    }); 
}