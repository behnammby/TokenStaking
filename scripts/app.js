module.exports = {
    advanceInTime: (seconds) => {
        return new Promise((resolve, reject) => {
            web3.currentProvider.send(
                {
                    jsonrpc: "2.0",
                    method: "evm_increaseTime",
                    params: [seconds],
                    id: new Date().getTime()
                },
                (err, result) => {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(result)
                }
            )
        })
    },
    mine: () => {
        return new Promise((resolve, reject) => [
            web3.currentProvider.send(
                {
                    jsonrpc: "2.0",
                    method: "evm_mine",
                    params: [],
                    id: new Date().getTime()
                },
                (err, result) => {
                    if (err) {
                        return reject(result)
                    }

                    return resolve(result)
                }
            )
        ])
    }
}