require.paths.unshift('.')
var assert = require('assert'),
    mongoose = require('mongoose').Mongoose,
    mongo = require('mongodb'),
    ObjectID = require('mongodb/bson/bson').ObjectID;

mongoose.model('User', {
  properties: ['_someid', 'first', 'last', {'nested': ['test']}]
});

module.exports = {
  
  'test clearing records and counting': function(){
    var db = mongoose.connect('mongodb://localhost/mongoose-tests'),
        User = db.model('User');
    User.remove({}, function(){
      assert.ok(true)
      User.count({}, function(c){
        assert.equal(c, 0)
        db.close();
      });
    })
  },
  
  'test saving and hydration': function(){
    var db = mongoose.connect('mongodb://localhost/mongoose-tests_2'),
        User = db.model('User');
    var john = new User();
    john.first = 'John';
    john.last = 'Lock';
    john.save(function(){
      assert.ok(true);
      User.find({
        first: 'John'
      }).first(function(john){
        assert.ok(john);
        assert.ok(john instanceof User);
        assert.ok(john._id);
        assert.ok(john._id.toHexString);
        assert.equal(john.last, 'Lock');
        db.close();
      });
    });
  },
  
  'test finding many bypassing hydration': function(){
    var db = mongoose.connect('mongodb://localhost/mongoose-tests_3'),
        User = db.model('User'), 
        _count = 0,
        callback = function(){
          if (++_count == 2){
            User.find({}, false).all(function(res){
              assert.ok(res instanceof Array);
              assert.ok(res.length);
              assert.ok(typeof res[0] == 'object')
              assert.ok(! (res[0] instanceof User))
              db.close();
            });
          }
        };
        
    var john = new User();
    john.first = 'Test';
    john.last = 'Test 2';
    john.save(callback);
    
    var mark = new User();
    mark.first = 'Test';
    mark.last = 'Test 2';
    mark.save(callback);
  },
  
  'test saving and searching for nested': function(){
    var db = mongoose.connect('mongodb://localhost/mongoose-tests_4'),
        User = db.model('User');

    User.remove({}, function(){
      var john = new User();
      john.first = 'john';
      john.nested.test = 'ok';
      john.save(function(){
        User.find({ 'nested.test': 'ok' }).one(function(john){
          assert.equal(john.first, 'john');
          db.close();
        });
      });
    })
  },
  
  'test finding by id': function(){
    var db = mongoose.connect('mongodb://localhost/mongoose-tests_5'),
        User = db.model('User'),
        _completed = 0,
        complete = function(){
          if (++_completed == 2) db.close();
        };
    var john = new User();
    john.first = 'John';
    john.last = 'Lock';
    john.save(function(){

      User.findById(john._id, function(john){
        assert.equal(john.first, 'John');
        complete();
      });
      
      User.findById(john._id.toHexString(), function(john){
        assert.equal(john.last, 'Lock');
        complete();
      });
      
    });
  }
  
};