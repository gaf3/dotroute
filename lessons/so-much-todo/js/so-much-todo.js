TodoApp = new DoTRoute.Application();

TodoApp.partial("Header",$.ajax({url: "header.html", async: false}).responseText);
TodoApp.partial("Main",$.ajax({url: "main.html", async: false}).responseText);
TodoApp.partial("Footer",$.ajax({url: "footer.html", async: false}).responseText);

TodoApp.template("Todos",$.ajax({url: "todos.html", async: false}).responseText,null,TodoApp.partials);
TodoApp.route("home","/","Todos");
