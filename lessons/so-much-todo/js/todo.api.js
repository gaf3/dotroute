var todoAPI = function(storage) {
    this.todos = [];
    this.storage = storage ? storage : "todos";
}

todoAPI.prototype.constructor = todoAPI;

todoAPI.prototype.save = function() {
    localStorage.setItem(this.storage, JSON.stringify(this.todos));
}

todoAPI.prototype.load = function() {
    this.todos = JSON.parse(localStorage.getItem(this.storage) || "[]");
}

todoAPI.prototype.next = function() {
    max = 0; 
    for (var index = 0; index < this.todos.length; index++) {
        if (this.todos[index].id > max) {
            max = this.todos[index].id;
        }
    }
    return max+1;
}

todoAPI.prototype.find = function(id) {
    for (var index = 0; index < this.todos.length; index++) {
        if (this.todos[index].id == id) {
            return index;
        }
    }
}

todoAPI.prototype.list = function(status) {
    var list = [];
    for (var index = 0; index < this.todos.length; index++) {
        if (status == null || status == this.todos[index].status) {
            list.push(this.todos[index]);
        }
    }
    return list;
}

todoAPI.prototype.counts = function() {
    var count = {
        total: this.todos.length,
        complete: 0,
        incomplete: 0
    };
    for (var index = 0; index < this.todos.length; index++) {
        count[this.todos[index].status]++;
    }
    return count;
}

todoAPI.prototype.create = function(text) {
    var new_id = this.next();
    this.todos.push({id: new_id,text: text, status: "incomplete"});
    this.save();
    return new_id;
}

todoAPI.prototype.update = function(id,text,status) { 
    if (id == null) {
        for (var index = 0; index < this.todos.length; index++) {
            this.update(this.todos[index].id,text,status);
        }
    } else {
        var index = this.find(id);
        if (text != null) {
            this.todos[index].text = text;
        }
        if (status != null) {
            this.todos[index].status = status;
        }
        this.save();
    }
}

todoAPI.prototype.destroy = function(id) {
    var index = this.find(id);
    if (index == null) {
        throw "Id not found: " + id;
    }
    this.todos.splice(index,1);
    this.save();
}

todoAPI.prototype.purge = function() {
    for (var index = this.todos.length - 1; index > -1; index--) {
        if ("complete" == this.todos[index].status) {
            this.todos.splice(index,1);
        }
    }
    this.save();
}
