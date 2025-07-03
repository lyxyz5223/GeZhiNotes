package jwt

import (
	"crypto/rsa"
	"errors"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

type Claim struct {
	Uid  int
	Name string
}

func getPrivateKey() (*rsa.PrivateKey, error) {
	privateKeyData, err := os.ReadFile("./private.pem")
	if err != nil {
		return nil, err
	}
	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM(privateKeyData)
	if err != nil {
		return nil, err
	}
	return privateKey, nil
}

func GenerateJwt(claim Claim) (string, error) {
	privateKey, err := getPrivateKey()
	if err != nil {
		return "", err
	}
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"uid":  claim.Uid,
		"name": claim.Name,
	})
	signedToken, err := token.SignedString(privateKey)
	if err != nil {
		return "", err
	}
	return signedToken, nil
}

func GetPublicKey() (*rsa.PublicKey, error) {
	publicKeyData, err := os.ReadFile("./public.pem")
	if err != nil {
		return nil, err
	}
	publicKey, err := jwt.ParseRSAPublicKeyFromPEM(publicKeyData)
	if err != nil {
		return nil, err
	}
	return publicKey, nil
}

func ParseAndCheckJwt(tokenString string) (*jwt.Token, error) {
	publicKey, err := GetPublicKey()
	if err != nil {
		return nil, err
	}
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodRS256 {
			return nil, errors.New("not expected method")
		}
		return publicKey, nil
	})
	return token, nil
}

func GetClaim(token *jwt.Token) (Claim, error) {
	var claim Claim
	claims, ok := token.Claims.(jwt.MapClaims)

	if !ok {
		return claim, errors.New("get Claim error")
	}

	Uid, ok := claims["uid"].(float64)
	if !ok {
		return Claim{}, errors.New("uid transfer fail")
	}
	claim.Uid = int(Uid)

	claim.Name, ok = claims["name"].(string)
	if !ok {
		return Claim{}, errors.New("name transfer fail")
	}

	return claim, nil
}
