const fs = require('fs');
const csv = require('fast-csv');

/**
 * 
 * @param { array } data 
 * @param { group by item } groupItemIndex 
 * @param { sum by item } sumItemIndex 
 */
exports.groupByNameAndSum = (readData, sumItemIndex) => {

    //-- remove first record for header
    const column = readData.shift();

    const newData = readData.map( item => item[sumItemIndex])
    const estHourData = readData.map( item =>item[2])

    const workingHours = newData.reduce( (acc, cur) => parseFloat(acc) + parseFloat(cur),0 )
    const estHours = estHourData.reduce( (acc, cur) => parseFloat(acc) + parseFloat(cur),0 )

    return [workingHours, estHours];
}



/**
 * 
 * @param { array } data 
 * @param { group by item } groupItemIndex 
 * @param { sum by item } sumItemIndex 
 */
exports.groupByAndSum = (readData, groupItemIndex, sumItemIndex) => {

    //-- remove first record for header
    const column = readData.shift();

    // processed Data
    const newData = twoColumnForGroupBy(readData, groupItemIndex, sumItemIndex)

    const newResult = groupBySum(newData)

    //-- sorting by A-Z
    newResult.sort((a, b) => a[0].toUpperCase() > b[0].toUpperCase())

    //-- set Header
    const header = [column[groupItemIndex], column[sumItemIndex]];
    newResult.unshift(header)

    return newResult;
}

// only for task
exports.groupByAndSumWithEst = (estData, readData, groupItemIndex, sumItemIndex) => {

    //-- remove first record for header
    const column = readData.shift();

    // processed Data
    const newData = twoColumnForGroupBy(readData, groupItemIndex, sumItemIndex)


    const newResult = groupBySum(newData, estData)

    //-- sorting by A-Z
    newResult.sort((a, b) => a[0].toUpperCase() > b[0].toUpperCase())

    //-- set Header
    const header = [column[groupItemIndex], column[sumItemIndex], 'Est Hours'];
    newResult.unshift(header)

    return newResult;
}

//-- String Column & SUM Column
const twoColumnForGroupBy = (data, groupItemIndex, sumItemIndex) => {
    const newData = data.map((item, index) => {
        return [
            item[groupItemIndex],
            item[sumItemIndex]
        ]
    })
    return newData;
}

//-- Group By And Sum
const groupBySum = (data, estData=[]) => {
    let newResult = [];

    for (let rs of data) {

        const findIndex = newResult.findIndex(index => index[0] == rs[0])
        if (findIndex == -1) { // -1 means undefined
            
            const getEstHour = estData.find( task => task[0] == rs[0])// find Est Task for HOUR
            if ( getEstHour ) {
                newResult.push([...rs, getEstHour[1]])
            } else {
                newResult.push([...rs, '0'])
            }            
            
        } else {
            newResult[findIndex][1] = parseFloat(newResult[findIndex][1]) + parseFloat(rs[1])
        }
    }

    return newResult;
}


//-- Read .CSV file
exports.readCsvFile = (filePath) => {
    
    //-- Est Hour Generate
    if (!fs.existsSync(filePath)) {
        console.log('File does not exists')
        return res.status(404).json({
            message: 'File is not exists.'
        })
    }

    return new Promise((resolve, reject) => {
        let arrayData = []
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', data => {
                arrayData.push(data)
            })
            .on('end', data => {
                resolve(arrayData)
            });
    })
}

exports.writeCsvFile = (processData,filePath) => {
    const dirName = filePath.split('/')[0]
    if (!fs.existsSync(dirName)){
        fs.mkdirSync(dirName);
    }

    const ws = fs.createWriteStream(filePath);
    csv.write(processData, { headers: true, quoteColumns: true })
        .pipe(ws)

    return true;
}
