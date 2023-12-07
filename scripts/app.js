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
    },
    block: () => {
        return new Promise((resolve, reject) => {
            web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "eth_blockNumber",
                params: [],
                id: new Date().getTime()
            }, function (error, result) {
                if (!error) {
                    let blockNumber = parseInt(result.result, 16);
                    web3.currentProvider.send({
                        jsonrpc: "2.0",
                        method: "eth_getBlockByNumber",
                        params: [blockNumber, true],
                        id: new Date().getTime()
                    }, function (error, result) {
                        if (!error) {
                            let timestamp = parseInt(result.result.timestamp, 16);
                            resolve(timestamp);
                        } else {
                            reject(error);
                        }
                    });
                } else {
                    reject(error);
                }
            });
        });
    }
}