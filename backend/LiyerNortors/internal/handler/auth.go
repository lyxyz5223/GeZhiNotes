package handler

import(
	"LiyerNortorsAIpart/internal/jwt"

	"net/http"
	"errors"

	"github.com/gin-gonic/gin"
)

func AuthMiddlerWare(c *gin.Context){
	TokenString, err  := c.Cookie("token")
	if err != nil{
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error" : err.Error()})
		return
	}

	token, err := jwt.ParseAndCheckJwt(TokenString) 
	if err != nil{	
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error" : err.Error()})
		return
	}

	claim , err := jwt.GetClaim(token)
	if err != nil{
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error" : err.Error()})
		return
	}

	c.Set("uid", claim.Uid)
	c.Set("name", claim.Name)

	c.Next()
}

func GetUid(c *gin.Context) (int, error) {
	uid, ok := c.Value("uid").(int)
	if !ok {
		return 0, errors.New("not login")
	}

	return uid, nil
}