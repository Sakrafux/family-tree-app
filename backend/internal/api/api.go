package api

import (
	"math"
	"net/http"
	"strconv"

	"github.com/Sakrafux/family-tree/backend/internal/errors"
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
		errors.HandleHttpError(w, r, err)
		return
	}

	writeJson(w, data)
}

func (h *Handler) GetSubgraphForRoot(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		errors.HandleHttpError(w, r, errors.NewBadRequestError(err.Error()))
		return
	}
	distance := math.MaxInt
	if r.URL.Query().Has("distance") {
		distance, err = strconv.Atoi(r.URL.Query().Get("distance"))
		if err != nil {
			errors.HandleHttpError(w, r, errors.NewBadRequestError(err.Error()))
			return
		}
	}

	data, err := h.graphService.GetSubgraphForRootById(id, distance)
	if err != nil {
		errors.HandleHttpError(w, r, err)
		return
	}

	writeJson(w, data)
}
