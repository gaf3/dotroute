var test_storage = "test_todos";

QUnit.module("todoAPI", {
    setup: function() {
        localStorage.removeItem(test_storage);
    },
    teardown: function() {
        localStorage.removeItem(test_storage);
    }
});

QUnit.test("constructor", function(assert) {

    var todos_api = new todoAPI();
    assert.deepEqual(todos_api.todos,[]);
    assert.equal(todos_api.storage,"todos");

    var other_api = new todoAPI("other");
    assert.equal(other_api.storage,"other");

});

QUnit.test("save", function(assert) {

    var todos_api = new todoAPI(test_storage);
    todos_api.todos = [1,2,3];
    todos_api.save();
    assert.equal(localStorage.getItem(test_storage),'[1,2,3]');

});

QUnit.test("load", function(assert) {

    localStorage.setItem(test_storage,'[4,5,6]');
    var todos_api = new todoAPI(test_storage);
    todos_api.load();
    assert.deepEqual(todos_api.todos,[4,5,6]);

});

QUnit.test("next", function(assert) {

    var todos_api = new todoAPI(test_storage);
    assert.equal(todos_api.next(),1);

    todos_api.todos = [{id: 4}];
    assert.equal(todos_api.next(),5);

});

QUnit.test("find", function(assert) {

    var todos_api = new todoAPI(test_storage);
    assert.equal(todos_api.find(4),null);

    todos_api.todos = [{id: 3},{id: 4},{id: 5}];
    assert.equal(todos_api.find(2),null);
    assert.equal(todos_api.find(3),0);
    assert.equal(todos_api.find(4),1);
    assert.equal(todos_api.find(5),2);

});

QUnit.test("list", function(assert) {

    var todos_api = new todoAPI(test_storage);
    todos_api.todos = [
        {id: 3, status: "completed"},
        {id: 4, status: "active"},
        {id: 5, status: "completed"}
    ];
    assert.deepEqual(todos_api.list(),todos_api.todos);
    assert.deepEqual(todos_api.list("completed"),[{id: 3, status: "completed"},{id: 5, status: "completed"}]);
    assert.deepEqual(todos_api.list("active"),[{id: 4, status: "active"}]);

});

QUnit.test("counts", function(assert) {

    var todos_api = new todoAPI(test_storage);
    todos_api.todos = [
        {id: 3, status: "completed"},
        {id: 4, status: "active"},
        {id: 5, status: "completed"}
    ];
    assert.deepEqual(todos_api.counts(),{total: 3, completed: 2, active: 1});

});

QUnit.test("create", function(assert) {

    var todos_api = new todoAPI(test_storage);
    assert.equal(todos_api.create("This one"),1);
    assert.deepEqual(todos_api.todos,[{id: 1, text: "This one", status: "active"}]);
    assert.equal(localStorage.getItem(test_storage),'[{"id":1,"text":"This one","status":"active"}]');

    assert.equal(todos_api.create("That one"),2);
    assert.deepEqual(todos_api.todos[1],{id: 2, text: "That one", status: "active"});

});

QUnit.test("update", function(assert) {

    var todos_api = new todoAPI(test_storage);
    todos_api.create("This one");
    todos_api.create("That one");

    todos_api.update(2,"Other one","completed");
    assert.deepEqual(todos_api.todos[0],{id: 1, text: "This one", status: "active"});
    assert.deepEqual(todos_api.todos[1],{id: 2, text: "Other one", status: "completed"});
    assert.deepEqual(JSON.parse(localStorage.getItem(test_storage))[1],{id: 2, text: "Other one", status: "completed"});

    todos_api.update(1,null,"completed");
    assert.deepEqual(todos_api.todos[0],{id: 1, text: "This one", status: "completed"});
    assert.deepEqual(todos_api.todos[1],{id: 2, text: "Other one", status: "completed"});

    todos_api.update(null,null,"active");
    assert.deepEqual(todos_api.todos[0],{id: 1, text: "This one", status: "active"});
    assert.deepEqual(todos_api.todos[1],{id: 2, text: "Other one", status: "active"});

    try {
        todos_api.update(3,"No One","active");
        assert.ok(false);
    } catch (exception) {
        assert.ok(true);
    }

});

QUnit.test("destroy", function(assert) {

    var todos_api = new todoAPI(test_storage);
    todos_api.create("This one");
    todos_api.create("That one");
    todos_api.create("Other one");
    assert.deepEqual(todos_api.todos[0],{id: 1, text: "This one", status: "active"});
    assert.deepEqual(todos_api.todos[1],{id: 2, text: "That one", status: "active"});
    assert.deepEqual(todos_api.todos[2],{id: 3, text: "Other one", status: "active"});

    todos_api.destroy(2);
    assert.deepEqual(todos_api.todos[0],{id: 1, text: "This one", status: "active"});
    assert.deepEqual(todos_api.todos[1],{id: 3, text: "Other one", status: "active"});
    assert.deepEqual(JSON.parse(localStorage.getItem(test_storage))[1],{id: 3, text: "Other one", status: "active"});

    todos_api.destroy(1);
    assert.deepEqual(todos_api.todos[0],{id: 3, text: "Other one", status: "active"});

    try {
        todos_api.destroy(4);
        assert.ok(false);
    } catch (exception) {
        assert.ok(true);
    }

});

QUnit.test("purge", function(assert) {

    var todos_api = new todoAPI(test_storage);
    todos_api.create("This one");
    todos_api.create("That one");
    todos_api.create("Other one");
    todos_api.update(1,null,"completed");
    todos_api.update(2,null,"completed");
    assert.deepEqual(todos_api.todos[0],{id: 1, text: "This one", status: "completed"});
    assert.deepEqual(todos_api.todos[1],{id: 2, text: "That one", status: "completed"});
    assert.deepEqual(todos_api.todos[2],{id: 3, text: "Other one", status: "active"});

    todos_api.purge();
    assert.deepEqual(todos_api.todos[0],{id: 3, text: "Other one", status: "active"});
    assert.deepEqual(JSON.parse(localStorage.getItem(test_storage))[0],{id: 3, text: "Other one", status: "active"});

    todos_api.purge();
    assert.deepEqual(todos_api.todos[0],{id: 3, text: "Other one", status: "active"});

});
