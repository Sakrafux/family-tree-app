package internal

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/Sakrafux/family-tree/backend/internal/middleware"
	"github.com/Sakrafux/family-tree/backend/internal/router"
	"github.com/kuzudb/go-kuzu"
)

type AppConfig struct {
	DB_KUZU_PATH   string
	DB_SQLITE_PATH string
	PORT           string
}

type DbContext struct {
	kuzuDb   *kuzu.Database
	kuzuConn *kuzu.Connection
	sqlDB    *sql.DB
}

type App struct {
	db     *DbContext
	config *AppConfig
	server *http.Server
}

func NewApp(config *AppConfig) *App {
	return &App{config: config, db: &DbContext{kuzuDb: nil, kuzuConn: nil}}
}

func (app *App) Start() {
	app.connectToDatabases(app.config.DB_KUZU_PATH, app.config.DB_SQLITE_PATH)
	defer app.closeDatabase()

	app.server = &http.Server{
		Addr:    app.config.PORT,
		Handler: app.createRouter(),
	}

	log.Println("Listening on " + app.config.PORT + "...")
	panic(app.server.ListenAndServe())
}

func (app *App) connectToDatabases(kuzuPath, sqlitePath string) {
	app.db.kuzuDb, app.db.kuzuConn = db.ConnectToKuzu(kuzuPath)
	app.db.sqlDB = db.ConnectToSqlite(sqlitePath)
}

func (app *App) closeDatabase() {
	app.db.kuzuConn.Close()
	app.db.kuzuDb.Close()
	app.db.sqlDB.Close()
}

func (app *App) createRouter() http.Handler {
	stack := middleware.CreateStack(
		middleware.Logging,
		middleware.Cors,
		middleware.LoadUser,
	)

	return stack(router.CreaterRouter(app.db.kuzuConn, app.db.sqlDB))
}
