export default {"abi":{"ABI version":2,"header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"addrFaucet","type":"address"},{"name":"addrTokenRoot","type":"address"},{"name":"addrFaucetTokenWallet","type":"address"}],"outputs":[]},{"name":"getDebotInfo","id":"0xDEB","inputs":[],"outputs":[{"name":"name","type":"bytes"},{"name":"version","type":"bytes"},{"name":"publisher","type":"bytes"},{"name":"key","type":"bytes"},{"name":"author","type":"bytes"},{"name":"support","type":"address"},{"name":"hello","type":"bytes"},{"name":"language","type":"bytes"},{"name":"dabi","type":"bytes"},{"name":"icon","type":"bytes"}]},{"name":"getRequiredInterfaces","inputs":[],"outputs":[{"name":"interfaces","type":"uint256[]"}]},{"name":"start","inputs":[],"outputs":[]},{"name":"mainMenu","inputs":[],"outputs":[]},{"name":"checkDeploy","inputs":[{"name":"value","type":"bool"}],"outputs":[]},{"name":"checkUserTokenWalletExists2","inputs":[{"name":"acc_type","type":"int8"}],"outputs":[]},{"name":"debotEnterPoint","inputs":[{"name":"sender","type":"address"}],"outputs":[]},{"name":"getTokenWalletAddr","inputs":[{"name":"value","type":"bytes"}],"outputs":[]},{"name":"getTokenWalletAddr2","inputs":[{"name":"value","type":"uint256"}],"outputs":[]},{"name":"getTokenWalletAddrCb","inputs":[{"name":"value","type":"address"}],"outputs":[]},{"name":"checkUserTokenWalletExists","inputs":[{"name":"acc_type","type":"int8"}],"outputs":[]},{"name":"getFaucetBalanceCb","inputs":[{"name":"value","type":"uint32"}],"outputs":[]},{"name":"getWalletBalanceCb","inputs":[{"name":"balance","type":"uint128"}],"outputs":[]},{"name":"deployWallet","inputs":[],"outputs":[]},{"name":"claimTokens","inputs":[],"outputs":[]},{"name":"claimTokensCb","inputs":[],"outputs":[]},{"name":"back","inputs":[],"outputs":[]},{"name":"onError","inputs":[{"name":"sdkError","type":"uint32"},{"name":"exitCode","type":"uint32"}],"outputs":[]},{"name":"onError1","inputs":[{"name":"sdkError","type":"uint32"},{"name":"exitCode","type":"uint32"}],"outputs":[]},{"name":"upgrade","inputs":[{"name":"state","type":"cell"}],"outputs":[]},{"name":"getDebotOptions","inputs":[],"outputs":[{"name":"options","type":"uint8"},{"name":"debotAbi","type":"bytes"},{"name":"targetAbi","type":"bytes"},{"name":"targetAddr","type":"address"}]},{"name":"setABI","inputs":[{"name":"dabi","type":"bytes"}],"outputs":[]}],"data":[],"events":[]},"image":"te6ccgEChgEAFU8AAgE0AwEBAcACAEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgBCSK7VMg4wMgwP/jAiDA/uMC8guABQR+ArIh2zzTAAGOHYECANcYIPkBAdMAAZTT/wMBkwL4QuIg+GX5EPKoldMAAfJ64tM/AfhDIbnytCD4I4ED6KiCCBt3QKC58rT4Y9MfAfgjvPK50x8B2zz4R27yfCEGAToi0NcLA6k4ANwhxwDcIdcNH/K8Id0B2zz4R27yfAYCKCCCEFDqN4e74wIgghB97NDbu+MCMwcCKCCCEGzAojm74wIgghB97NDbu+MCHwgDPCCCEG76q1y64wIgghBxWkhouuMCIIIQfezQ27rjAhAMCQN2MPhCbuMA0ds8JI4mJtDTAfpAMDHIz4cgznHPC2FeIVUwyM+T97NDbssHzMzOzclw+wCSXwTi4wB/+Gd/CoUE9nCIiI0IYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABPhLbrOW+EsgbvJ/joDiM/hMbrOW+EwgbvJ/joDiMvhNbrOW+E0gbvJ/jiSNCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATiMfhKNH5+CwsBAoh+AyAw+EJu4wDSANHbPNs8f/hnfw2FAg4gjoCOgOIwDw4BBNs8WwEUghAnHb7d+FPbPEUDMDD4Qm7jANcNf5XU0dDTf9/R2zzbPH/4Z38RhQRKcG8AyI0FlRJUC0zIFdhbGxldCBhZGRyZXNzOiCDbPPhT2zzbPGgZYxIEaNs8cG8AyI0FlRJUC0zIFdhbGxldCBiYWxhbmNlOiCDbPCNwcHDbPIuyBEZU5TIFRva2VuhiaGQTBBTbPNs82zz4VMMAaGNiFAIMjoCOgOIwFxUCUnCI2zz4KMjPhYjOjQVOYloAAAAAAAAAAAAAAAAAABM/GxzAzxbJcPsAFmIAOFlvdSBoYXZlIG5vIHRva2VucyB0byBjbGFpbS4CUnCI2zz4KMjPhYjOjQVOYloAAAAAAAAAAAAAAAAAACh1G8PAzxbJcPsAGGIAQlNpZ24gdGhlIHRyYW5zYWN0aW9uIHRvIGNsYWltIGl0LgJqIPpEXyQj2zwBNjQjzzUgwgiXJIA6zwsHNZ5fJW+MNsg1JIA6zwsHNeJfJSOAQH9/cNs8bGIaGwEcXzK2C3BwfybBANs8bDIbAnolzzWrAiCaXydvjDgwyDaAf98jkoAwkoAg4iKXJ4AtzwsHON4hpTIhml8ob4w5yDiAfzLfJoAQ2zwgb4gnZxwBto5VU3C5IJQwJ8J/3/LQRVNwoVMEu44aIJZTo88LBzvkU0ChNSSaXytvjDzIO4B/Nd+OIiSWU6PPCwc75F8rb4w8yDtTBKGWU6PPCwc75IB/IaEloDXiMN5TA7sdAVSOKCCOJCFvjQEzIMEKmSqAMCKgzwsHO59TppKAV5KAN+IioM8LBzviMOQeAMCOWSOOJCFvjQEzIMEKmSqAMCKgzwsHO59TppKAV5KAN+IioM8LBzviMORfKm+MO8g6UwOhjiQhb40BMyDBCpkqgDAioM8LBzufU6aSgFeSgDfiIqDPCwc74jDk4l8qbLIEUCCCEFhkLQq64wIgghBZemdfuuMCIIIQXXeMObrjAiCCEGzAojm64wIwJyUgAnIw+EJu4wD4RvJzf/hm+kGV1NHQ+kDf+kGV1NHQ+kDf+kGV1NHQ+kDf0fgAIvhuAfhv+HAw2zx/+GchhQIW7UTQ10nCAYqOgOJ/IgG8cO1E0PQFcPhqbfhrbfhsbfhtjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE+G6NCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT4byMB/I0IYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABPhwjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE+HFw+HKNCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT4c3D4dIBA9A7yvSQAFtcL//hicPhjcPhmAx4w+EJu4wDU0ds82zx/+Gd/JoUAMPhC+EUgbpIwcN668uBk+AD4SnGx+Gr4awMeMPhCbuMA1NHbPNs8f/hnfyiFBBqIIds82zwwIPhy2zwwLywpXQEOcHCOgNhsEioBxCLQINdJwQiWcHBsI1gw4F8g0wcyIMAtcCPXSVMilDAgwg/emSTTB9MHNwE1Mt4isyCUMCDCB96VJNMHNjLeI8AwIJQwIcB43iOVJtMHODDeIJcm0wfTBzlb3nB/KNdJqwIjKwDwjkogjkYp0wc7I6cQNCDCLyCUMCDBOt6WIKbQJKA0jikgwkAglDAgwUfeliCmySSgNI4VIMJgIJQwIMFn3pYgpqkkoDSScDPi4uIw5I4fII4bKdMHOyDBMCCUMCDCOd+ScDPeI6cKNKbQI6Az5OImkyKjM95fImzCBDQh2zwi0F8y2zwBNDKUIHHXRo6A6F8i2zxsUS5oLWMBGCDVATIxXzLbPAE0MmgARG8AIdCVINdKwwCeINUBMiHIzlMwb4w0MDHoyFzOMVMgbEIABDB4A4Qw+EJu4wDR2zwhji4j0NMB+kAwMcjPhyDOjQQAAAAAAAAAAAAAAAANhkLQqM8WAW8iAssf9ADJcPsAkTDi4wB/+Gd/MYUB/nBtbwJ1bYLwh5ZTY2buIYUttW3MtgvFZFmLYYyGX8UMixq3QLuhKOPIy/9wWIAg9EOC8KwaTT7OojLkl4PfSiOoGCPNyjIF3FjNIMTbJZwlYFtIyMv/cViAIPRDgvDX7RvY5iMIcRFvRSLljfCpPFUgxW9K3iPvPYkZqYRlO8gyAMLL/3JYgCD0Q4LwFmU+rzTJIUZxIPJoXUJf+WPbXLtapnamKi4zv8P2gorIy/9zWIAg9EOC8KVhFRR3Ce00N++4lGC5ShILf+lDeceV0euwQ1qEfuWAyMv/dFiAIPRDbwIxBFAgghAZSkenu+MCIIIQJx2+3bvjAiCCEDZ4WJq74wIgghBQ6jeHu+MCXlBCNARQIIIQOmU2S7rjAiCCEEhrF/m64wIgghBLG9tVuuMCIIIQUOo3h7rjAjw4NzUDHDD4Qm7jANHbPNs8f/hnfzaFAJj4Tou5JhNpwiIkNYv8gXTIzs5xzwsF+FPIz4OBAgDPQHAgbpMwz4GVAc+Dy//ijQQAAAAAAAAAAAAAAAASvXpjIM8WAcjOzc3JcPsAAxww+EJu4wDR2zzbPH/4Z39uhQMkMPhCbuMA0x/TH9HbPNs8f/hnfzmFBFhwbwDIi6U2RrIGVycm9yII2zwkcHBw2zyLwuIEV4aXQgY29kZSCNs8I3BwcGhkaDoEEts8ixLo2zzbPGRoYzsCCts82zxbYlsDJDD4Qm7jANMf0x/R2zzbPH/4Z389hQMWIMBljoCOgOLbPFtAPlsEaHBvAMiNBFFcnJvciEgU2RrIGVycm9yIINs8JHBwcNs8i8LiBFeGl0IGNvZGUgjbPCNwcHBoZGg/BBbbPIsS6Ns82zzbPGRoY2ICCHCI2zxBYgC8Tm8gRGVOUyBUb2tlbnMgaGF2ZSBiZWVuIGFsbG9jYXRlZCB0byB0aGlzIHdhbGxldCB5ZXQuIENvbnRhY3QgeW91ciBTdWJnb3Zlcm5hbmNlIGZvciBkZXRhaWxzLgRQIIIQKZeBl7rjAiCCEDBEHN664wIgghAz4CKHuuMCIIIQNnhYmrrjAk5KRkMDLjD4Qm7jAPpBldTR0PpA39HbPNs8f/hnf0SFARog+HOCEDBEHN4h2zwwRQCojQhnDH4yKnyAOWT4+2mYnXCwR7J6UDMGNXT6FjRbU88VDeJcVHEgyM+FiM6NBE5iWgAAAAAAAAAAAAAAAAAAwM8WWcjPkK4hREbLH87NyXD7AF8DAy4w+EJu4wD6QZXU0dD6QN/R2zzbPH/4Z39HhQIcIPhxghBZemdfiHDbPDBJSACkjQhnDDyymxs3cQwpbatuZbBeKyLMWwxkMv4oZFjVugXdCUccVHEjI8jPhYjOjQVOYloAAAAAAAAAAAAAAAAAAByq+5fAzxbLH8zKAMlw+wBfBAAaRW50ZXIgcHVia2V5OgMgMPhCbuMA0gfR2zzbPH/4Z39LhQIuIMD/IJswIMAAIJQwIMAC39+OgI6A4jBMUwJScIjbPPgoyM+FiM6NBU5iWgAAAAAAAAAAAAAAAAAAFMvAy8DPFslw+wBNYgBAVE9OIFRva2VuIFdhbGxldCBkb2Vzbid0IGV4aXN0cy4DHDD4Qm7jANHbPNs8f/hnf0+FAIz4Tou5JiWN7aqkNYv8gXTIzs5xzwsFyM+DgQIAz0BwIG6TMM+BlQHPg8v/4o0EAAAAAAAAAAAAAAAACmXgZeDPFs3JcPsABFAgghAe6qcfuuMCIIIQJn42ObrjAiCCECbThES64wIgghAnHb7duuMCXFpXUQMgMPhCbuMA0gfR2zzbPH/4Z39ShQIuIMD/IJswIMAAIJQwIMAC39+OgI6A4jBVUwKEcIjbPG34Tou5JgylI9OdMpslgXTIzs5xzwsF+FLIz4EjbvLgQI0EAAAAAAAAAAAAAAAAClvNbHDPFsv/zclw+wAwVGIAMFRPTiBUb2tlbiBXYWxsZXQgZXhpc3RzLgMMcIjbPNs8VmJuAExUT04gVG9rZW4gV2FsbGV0IHN0aWxsIGRvZXNuJ3QgZXhpc3RzLgMcMPhCbuMA0ds82zx/+Gd/WIUCEoIQJn42OYjbPFliAGBTdWNjZXNzISBZb3Ugd2lsbCByZWNpZXZlIHRva2VucyBpbiBmZXcgbW9tZW50cy4DHDD4Qm7jANHbPNs8f/hnf1uFAEr4UcjPhYjOjQVOYloAAAAAAAAAAAAAAAAAACWN7arAzxbJcPsAAzAw+EJu4wDXDf+V1NHQ0//f0ds82zx/+Gd/XYUAxG34T4u5Jhs8LE0kNYv8gXTIzs5xzwsFjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEI8jPgSRu8uBAjQQAAAAAAAAAAAAAAAAAAAADMM8Wy//Ozclw+wBbBEoggQ3ruuMCIIIQBZwNb7rjAiCCEBcjDDq64wIgghAZSkenuuMCcWxpXwMgMPhCbuMA0x/R2zzbPH/4Z39ghQRccG8AyI0EEZhdWNldCBiYWxhbmNlOiCDbPCNwcHDbPIuyBEZU5TIFRva2VujbPGhkaGECgts82zwg+HRt+FOLuSY3fVWuJDWL/IF0yM7Occ8LBcjPgSJu8uBAjQQAAAAAAAAAAAAAAAAAAAAC0M8Wzclw+wBbY2IAno0IZww8spsbN3EMKW2rbmWwXisizFsMZDL+KGRY1boF3QlHHFRxIMjPhYjOjQVOYloAAAAAAAAAAAAAAAAAAAZzJOFAzxbLH8zJcPsAXwMALpYhb4jAALOaIW+NATNTAc0xMeggyWwhAngkzzWrAiCaXyZvjDcwyDWAf98ikoAwkoAg4iKXJoAtzwsHN94hpTIhml8nb4w4yDeAfzLfJXrbPCBviCZnZQHejlVTYLkglDAmwn/f8tBCU2ChUwS7jhogllOTzwsHOuRTQKE1JJpfKm+MO8g6gH81344iJJZTk88LBzrkXypvjDvIOlMEoZZTk88LBzrkgH8hoSWgNeIw3lMDu44SIJ8hb40BMymAMCKgzwsHOjDkZgBoji0jnyFvjQEzKYAwIqDPCwc6MORfKW+MOsg5UwOhnyFvjQEzKYAwIqDPCwc6MOTiXylsogBCbwCOGiKVIHBvjDHhcJMjwwCaXakMATUxXG+MMugw2GwhAGwhzzWm+SHXSyCWI3Ai1zE03lMSuyCUU0XONo4VXyTXGDZTBs43XydvjDgwyDZTRc424l8mbHIDHjD4Qm7jANTR2zzbPH/4Z39qhQJo+EUgbpIwcN74Qrry4GQg0NQw+ADbPPgPIPsEINAgizits1jHBZPXTdDe10zQ7R7tU9s8W4VrAATwAgMcMPhCbuMA0ds82zx/+Gd/bYUBBNs8bgISghBxWkhoiNs8cG8Ano0IZwizKfV5pkkKM4kHk0LqEv/LHtrl2tUztTFRcZ3+H7QUVFRxIMjPhYjOjQVOYloAAAAAAAAAAAAAAAAAACGkhnlAzxbLH8zJcPsAXwMAIkNoZWNrIGRlcGxveW1lbnQ/A5Aw+EJu4wDR2zwqjjMs0NMB+kAwMcjPhyDOcc8LYV6BVZDIz5AAADeuzMzMVWDIzMzOzFUgyMzMzM3Nzclw+wCSXwri4wB/+Gd/coUEBoiIiH5+fnMEToiIjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEiH5+fnQEBoiIiH5+fnUEDIg6iDmIOH18e3YEVog3iDaNCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQ1iDR6e3l3AhaIM/hLIG7yfzKIMXh+AARlbgA4SGVsbG8sIEknbSBEZU5TIEZhdWNldCBEZWJvdAAsVm90aW5nIHN5c3RlbSBmb3IgRGVOUwAMUlNxdWFkAAowLjAuMQAiRGVOUyBGYXVjZXQgRGVib3QAAADI7UTQ0//TP9IA0wf0BAEgbpPQ10zfAfQEASBuk9DXTN8B9AQBIG6U0PpAMN8B+kDU0dD6QNTR0PpA1NHQ+kDT/9TR0PpA03/R+HT4c/hy+HH4cPhv+G74bfhs+Gv4avhm+GP4YgIK9KQg9KGCgQAUc29sIDAuNDcuMAEKoAAAAAKDAfxw+Gpt+Gtt+Gxt+G2NCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT4bo0IYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABPhvjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE+HCEAbCNCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT4cXD4co0IYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABPhzcPh02zz4D/IAhQDg+FT4U/hS+FH4UPhP+E74TfhM+Ev4SvhG+EP4QsjL/8s/ygDLBwEgbpMwz4GXyMwBz4PPEeIBIG6TMM+Bl8jMAc+DzxHiASBukzDPgZfIzgHPg88R4s5VUMjOVUDIzlUwyM7L/1nIzst/zc3NzcntVA=="}