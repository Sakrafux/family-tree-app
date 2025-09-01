package internal

import (
	"log"
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/Sakrafux/family-tree/backend/internal/middleware"
	"github.com/Sakrafux/family-tree/backend/internal/router"
	"github.com/Sakrafux/family-tree/backend/internal/server"
)

type App struct {
	Context *server.ApplicationContext
	Config  *server.Config
	Server  *http.Server
}

func NewApp(config *server.Config) *App {
	return &App{Context: &server.ApplicationContext{}, Config: config}
}

func (app *App) Start() {
	app.connectToDatabase(app.Config.DB_PATH)
	defer app.closeDatabase()

	app.Server = &http.Server{
		Addr:    app.Config.PORT,
		Handler: app.createRouter(),
	}

	log.Println("Listening on " + app.Config.PORT + "...")
	panic(app.Server.ListenAndServe())
}

func (app *App) connectToDatabase(path string) {
	app.Context.Db, app.Context.Conn = db.ConnectToDatabase(path)
}

func (app *App) closeDatabase() {
	app.Context.Conn.Close()
	app.Context.Db.Close()
}

func (app *App) createRouter() http.Handler {
	stack := middleware.CreateStack(
		middleware.Logging,
		middleware.LoadUser,
	)

	return stack(router.RegisterRoutes(app.Context))
}
