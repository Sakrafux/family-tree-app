package api

import (
	"encoding/json"
	"net/http"

	"github.com/Sakrafux/family-tree-app/backend/internal/errors"
)

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

var dummyData = map[string]bool{
	"01994d49-826f-76ac-aead-5bdf618ef2c5": true,
	"01994d49-8270-755a-bbb1-310ed0140db2": true,
	"01994d49-8270-755a-bbb1-37d4fda28301": true,
	"01994d49-8270-755a-bbb1-390cb53d432b": true,
	"01994d49-8270-755a-bbb1-3d7704871402": true,
	"01994d49-8270-755a-bbb1-42bf3f1fd9ba": true,
	"01994d49-8270-755a-bbb1-4eac575bec0f": true,
	"01994d49-8270-755a-bbb1-50baa8e31af1": true,
	"01994d49-8270-755a-bbb1-5435c2658136": true,
	"01994d49-8270-755a-bbb1-5a0ee242a486": true,
	"01994d49-8270-755a-bbb1-5cb5aaa32746": true,
	"01994d49-8270-755a-bbb1-616f585516a3": true,
	"01994d49-8270-755a-bbb1-65adc88896bb": true,
	"01994d49-8270-755a-bbb1-68a322cd4491": true,
}

func allowDummyDataForUnauthorized(r *http.Request, id string) error {
	if r.Context().Value("role") != nil || dummyData[id] {
		return nil
	}
	return errors.NewForbiddenError("Insufficient privileges")
}
