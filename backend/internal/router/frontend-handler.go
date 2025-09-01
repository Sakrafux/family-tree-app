package router

import (
	"net/http"
	"os"
	"path/filepath"
)

// This handler is based on `http.FileServer` but reroutes all paths to index.html for SPA behaviour
type FrontendHandler struct {
	fileServer http.Handler
}

func NewFrontendHandler() FrontendHandler {
	return FrontendHandler{http.FileServer(http.Dir("frontend"))}
}

func (h FrontendHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := filepath.Join("frontend", r.URL.Path)

	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		http.ServeFile(w, r, filepath.Join("frontend", "index.html"))
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.fileServer.ServeHTTP(w, r)
}
