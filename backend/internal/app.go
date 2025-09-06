package internal

import (
	"log"
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/Sakrafux/family-tree/backend/internal/middleware"
	"github.com/Sakrafux/family-tree/backend/internal/router"
	"github.com/kuzudb/go-kuzu"
)

type AppConfig struct {
	DB_PATH string
	PORT    string
}

type DbContext struct {
	db   *kuzu.Database
	conn *kuzu.Connection
}

type App struct {
	dbContext *DbContext
	config    *AppConfig
	server    *http.Server
}

func NewApp(config *AppConfig) *App {
	return &App{config: config, dbContext: &DbContext{db: nil, conn: nil}}
}

func (app *App) Start() {
	app.connectToDatabase(app.config.DB_PATH)
	defer app.closeDatabase()

	app.server = &http.Server{
		Addr:    app.config.PORT,
		Handler: app.createRouter(),
	}

	log.Println("Listening on " + app.config.PORT + "...")
	panic(app.server.ListenAndServe())
}

func (app *App) connectToDatabase(path string) {
	app.dbContext.db, app.dbContext.conn = db.ConnectToDatabase(path)
}

func (app *App) closeDatabase() {
	app.dbContext.conn.Close()
	app.dbContext.db.Close()
}

func (app *App) createRouter() http.Handler {
	stack := middleware.CreateStack(
		middleware.Logging,
		middleware.Cors,
		middleware.LoadUser,
	)

	return stack(router.CreaterRouter(app.dbContext.conn))
}
