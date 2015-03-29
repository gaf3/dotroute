TodosApp = new DoTRoute.Application();

TodosApp.template("Todos",$.ajax({url: "todos.html", async: false}).responseText);
TodosApp.route("home","/","Todos");