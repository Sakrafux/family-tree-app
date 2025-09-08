package service

import "sync"

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
