package api

import (
	"encoding/json"
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/kuzudb/go-kuzu"
)

type Handler struct {
	conn *kuzu.Connection
}

func NewHandler(conn *kuzu.Connection) *Handler {
	return &Handler{conn: conn}
}

func writeJson(w http.ResponseWriter, data any) {
	b, err := json.Marshal(data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(b)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (h *Handler) GetCompleteGraphData(w http.ResponseWriter, r *http.Request) {
	persons, err := db.GetAllPersons(h.conn)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	marriages, err := db.GetAllMarriageRelations(h.conn)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	parents, err := db.GetAllParentRelations(h.conn)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	container := map[string]any{
		"persons":   persons,
		"marriages": marriages,
		"parents":   parents,
	}

	writeJson(w, container)
}

func (h *Handler) GetAllPersons(w http.ResponseWriter, r *http.Request) {
	data, err := db.GetAllPersons(h.conn)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	writeJson(w, data)
}

func (h *Handler) GetAllMarriageRelations(w http.ResponseWriter, r *http.Request) {
	data, err := db.GetAllMarriageRelations(h.conn)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	writeJson(w, data)
}

func (h *Handler) GetAllParentRelations(w http.ResponseWriter, r *http.Request) {
	data, err := db.GetAllParentRelations(h.conn)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	writeJson(w, data)
}
