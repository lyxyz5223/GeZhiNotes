package handler

import (
	"LiyerNortorsAIpart/internal/models"
	"LiyerNortorsAIpart/internal/jwt"

	"net/http"

	"github.com/gin-gonic/gin"
)

func LoginHandler(c *gin.Context){
	var req models.LoginReq	
	var uid int

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err.Error()})
		return
	}

	uid, err := models.Login(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err.Error()})
		return
	}


	token, err := jwt.GenerateJwt(jwt.Claim{Uid: uid, Name: req.Name })
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Err" : err.Error()})
		return
	}

	c.SetCookie("token", token, 14400, "/", "localhost", false, true)
	c.JSON(http.StatusOK, gin.H{"Status" : "Ok"})
}