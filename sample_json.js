Potential Request with VF channel id:
`{
	"pushEvents":[
		"payload": {
			"tId" : "[TRANSACTION ID - random string]",
			"cId" : "[CONFIGURATION ID - from SFDC]",
			"vFSId" : "[VF Page Streaming Channel Id]"
			"lis" : [["PRODUCT ID - from li", "START DATE", "END DATE", "QUANT"],["PRODUCT ID - from li", "START DATE", "END DATE", "QUANT"]]
		},
		"userIds":[]
	]
	}`

Requests:
[`{
	"pushEvents":[
		"payload": {
			"tId" : "[TRANSACTION ID - random string]",
			"cId" : "[CONFIGURATION ID - from SFDC]",
			"lis" : [["PRODUCT ID - from li", "START DATE", "END DATE", "QUANT"],["PRODUCT ID - from li", "START DATE", "END DATE", "QUANT"]]
		},
		"userIds":[]
	]
	}`,
	`{
	"pushEvents":[
		"payload": {
			"tId" : "[TRANSACTION ID - random string]",
			"cId" : "[CONFIGURATION ID - from SFDC]",
			"lis" : [["PRODUCT ID - from li", "START DATE", "END DATE", "QUANT"],["PRODUCT ID - from li", "START DATE", "END DATE", "QUANT"]]
		},
		"userIds":[]
	]
	}`,
	`{
	"pushEvents":[
		"payload": {
			"tId" : "[TRANSACTION ID - random string]",
			"cId" : "[CONFIGURATION ID - from SFDC]",
			"lis" : [["PRODUCT ID - from li", "START DATE", "END DATE", "QUANT"],["PRODUCT ID - from li", "START DATE", "END DATE", "QUANT"]]
		},
		"userIds":[]
		]
	}`
]