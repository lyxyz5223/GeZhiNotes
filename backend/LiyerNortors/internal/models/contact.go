package models

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ExtractResq struct {
    Tags []string   `json:"tags"`
}

func Extract(c *gin.Context, input string, tags []string) ([]string, error){
    req := ContactReq{Tags: tags, Input : input}
    // 序列化请求体，转发给 Python API
    jsonData, err := json.Marshal(req)
    if err != nil {
        return nil, err
    }

    resp, err := http.Post("http://localhost:5000/extract", "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, errors.New("extract error")
    }

    var tagScores ExtractResq 
    if err := json.NewDecoder(resp.Body).Decode(&tagScores); err != nil {
        return nil, err
    }

    return tagScores.Tags, nil
}

type ContactResp struct{
    Tags []string `json:"tags"`
}

func Contact(c *gin.Context, Tags []string, Input string) ([]string, error){
    req := ContactReq{Tags, Input}
    // 序列化请求体，转发给 Python API
    jsonData, err := json.Marshal(req)
    if err != nil {
        return nil, err
    }

    resp, err := http.Post("http://localhost:5000/compare", "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, errors.New("contact error")
    }

    var tagScores ContactResp 
    if err := json.NewDecoder(resp.Body).Decode(&tagScores); err != nil {
        return nil, err
    }

    return tagScores.Tags, nil
}