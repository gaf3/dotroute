SoMuch = new DoTRoute.Application();
SoMuch.ToDo = new todoAPI();
SoMuch.ToDo.load();

SoMuch.controller("ToDos",null,{
    create: function(event) {
        if(event.keyCode == 13 && $(event.target).val().length) {
            this.application.ToDo.create($(event.target).val());
            this.application.refresh();
        }
    },
    all: function() {
        this.it = {
            todos: this.application.ToDo.list(),
            counts: this.application.ToDo.counts()
        };
        this.application.render(this.it);
    },
    some: function() {
        this.it = {
            todos: this.application.ToDo.list(this.application.current.path.status),
            counts: this.application.ToDo.counts()
        };
        this.application.render(this.it);
    },
    toggle: function(id,status) {
        this.application.ToDo.update(id,null,status);
        this.application.refresh();
    },
    edit: function(label) {
        $(label).parents("li").find(".viewing").hide();
        $(label).parents("li").find(".editing").show();
        $(label).parents("li").addClass("editing");
    },
    update: function(event,id) {
        if((event.keyCode == null || event.keyCode == 13) && $(event.target).val().length) {
            this.application.ToDo.update(id,$(event.target).val());
            this.application.refresh();
        }
    },
    destroy: function(id) {
        this.application.ToDo.destroy(id);
        this.application.refresh();
    },
    purge: function() {
        this.application.ToDo.purge();
        this.application.refresh();
    }
});

SoMuch.template("ToDos",$.ajax({url: "todos.html", async: false}).responseText);

SoMuch.route("all","/","ToDos","ToDos","all");
SoMuch.route("some","/{status:^(active|completed)$}/","ToDos","ToDos","some");
