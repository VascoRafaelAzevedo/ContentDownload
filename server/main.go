package main

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

const (
	torrentDir  = "/srv/torrents/.torrents"
	downloadDir = "/srv/torrents"
	publicURL   = "http://YOUR_DOMAIN/files"
)

type Response struct {
	DownloadURL string `json:"download_url"`
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("torrent")
	if err != nil {
		http.Error(w, "torrent required", 400)
		return
	}
	defer file.Close()

	os.MkdirAll(torrentDir, 0755)

	torrentFile, _ := os.CreateTemp(torrentDir, "*.torrent")
	io.Copy(torrentFile, file)
	torrentFile.Close()

	cmd := exec.Command(
		"aria2c",
		"--dir="+downloadDir,
		"--file-allocation=trunc",
		"--enable-mmap=true",
		torrentFile.Name(),
	)

	cmd.Start()

	go func() {
		cmd.Wait()

		// wait a bit in case client is still finishing
		time.Sleep(30 * time.Second)

		files, _ := os.ReadDir(downloadDir)
		for _, f := range files {
			os.Remove(filepath.Join(downloadDir, f.Name()))
		}
	}()

	resp := Response{
		DownloadURL: publicURL,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	http.HandleFunc("/api/download", uploadHandler)
	http.ListenAndServe(":8080", nil)
}
