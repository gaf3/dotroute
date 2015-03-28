var todoAPI = {
    todos: [],
    save: function() {
        localStorage.setItem("todos", JSON.stringify(this.todos));
    },
    load: function() {
        this.todos = JSON.parse(localStorage.getItem("todos") || "[]");
    },
    next: function() {
        max = 0; 
        for (var index = 0; index < this.todos.length; index++) {
            if (this.todos[index].id > max) {
                max = this.todos[index].id;
            }
        }
        return max+1;
    },
    find: function(id) {
        for (var index = 0; index < this.todos.length; index++) {
            if (this.todos[index].id == id) {
                return index;
            }
        }
    },
    list: function(status) {
        var list = [];
        for (var index = 0; index < this.todos.length; index++) {
            if (status === null || status == this.todos[index].status) {
                list.push(this.todos[index]);
            }
        }
        return list;
    },
    count: function() {
        var count = {
            total: this.todos.length,
            complete: 0,
            incomplete: 0
        };
        for (var index = 0; index < this.todos.length; index++) {
            count[this.todos[index].status]++;
        }
        return count;
    },
    create: function(text) {
        this.todos.push({id: this.next(),text: text, status: "incomplete"});
        this.save();
    },
    update: function(id,text,status) { 
        if (id === null) {
            for (var index = 0; index < this.todos.length; index++) {
                this.update(this.todos[index].id,text,status);
            }
        } else {
            var index = this.find(id);
            if (index !== null) {
                if (text !== null) {
                    this.todos[index].text = text;
                }
                if (status !== null) {
                    this.todos[index].status = status;
                }
                this.save();
            }
        }
    },
    destroy: function(id) {
        var index = this.find(id);
        if (index !== null) {
            this.todos.splice(index,1);
        }
        this.save();
    },
    purge: function() {
        for (var index = this.todos.length - 1; index > -1; index--) {
            if ("complete" == this.todos[index].status) {
                this.todos.splice(index,1);
            }
        }
        this.save();
    }
};
