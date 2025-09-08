package api

import (
	"encoding/json"
	"net/http"
	"sync"
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

func initAsync(n int) (*sync.WaitGroup, chan error) {
	chErr := make(chan error, n)
	var wg sync.WaitGroup
	wg.Add(n)

	return &wg, chErr
}

func asyncDbCall[R any](wg *sync.WaitGroup, chErr chan error, cb func() (R, error)) chan R {
	chR := make(chan R, 1)

	go func() {
		defer wg.Done()
		data, err := cb()
		chR <- data
		if err != nil {
			chErr <- err
		}
	}()

	return chR
}
