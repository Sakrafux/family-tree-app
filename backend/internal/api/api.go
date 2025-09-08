package api

import (
	"math"
	"net/http"
	"strconv"

	"github.com/Sakrafux/family-tree/backend/internal/service"
	"github.com/google/uuid"
	"github.com/kuzudb/go-kuzu"
)

type Handler struct {
	conn         *kuzu.Connection
	graphService *service.GraphService
}

func NewHandler(conn *kuzu.Connection) *Handler {
	return &Handler{
		conn:         conn,
		graphService: service.NewGraphService(conn),
	}
}

func (h *Handler) GetCompleteGraphData(w http.ResponseWriter, r *http.Request) {
	data, err := h.graphService.GetCompleteGraph()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJson(w, data)
}

func (h *Handler) GetSubgraphForRoot(w http.ResponseWriter, r *http.Request) {
	if !r.URL.Query().Has("id") {
		http.Error(w, "Invalid query parameters", http.StatusInternalServerError)
	}

	id, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	distance := math.MaxInt
	if r.URL.Query().Has("distance") {
		distance, err = strconv.Atoi(r.URL.Query().Get("distance"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	data, err := h.graphService.GetSubgraphForRootById(id, distance)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJson(w, data)
}
