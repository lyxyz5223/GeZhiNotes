package main

import(
	"LiyerNortorsAIpart/internal/handler"

	"github.com/gin-gonic/gin"
)

func main(){
	r := gin.Default()

	r.POST("/register", handler.RegisterHandler)
	r.POST("/login", handler.LoginHandler)

	user := r.Group("user")
	user.Use(handler.AuthMiddlerWare)
	user.POST("/save", handler.SaveHandler)
	user.POST("/search", handler.AnalyzeHandler)
	r.Run("localhost:8080")
}