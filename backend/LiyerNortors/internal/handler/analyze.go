package handler

import (
	"LiyerNortorsAIpart/internal/models"

	"net/http"

	"github.com/gin-gonic/gin"
)

func SaveHandler(c *gin.Context){
	var req models.SaveReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err.Error()})
		return
	}
	
	/*img, err  := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err})
		return
	}*/

	uid, err := GetUid(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err.Error()})
	}

	if err := models.Save(c, uid, nil, &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"Status" : "Ok"})
}

func AnalyzeHandler(c *gin.Context){
	var req models.AnalyzeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err.Error()})
		return
	}

	uid, err := GetUid(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err.Error()})
	}

	ResultCid, err := models.Analyze(c, uid, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err.Error()})
		return
	}	

	c.JSON(http.StatusOK, gin.H{"result" : ResultCid}) 
}