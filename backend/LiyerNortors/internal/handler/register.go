package handler

import (
	"LiyerNortorsAIpart/internal/models"
	
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterHandler(c *gin.Context){
	var req models.RegisterReq
	c.ShouldBindJSON(&req)

	if err := models.Register(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"Status" : "success"})
}


