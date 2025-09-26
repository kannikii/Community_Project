module.exports ={
    lengthOfList: (list = [])=>list.length,
    eq: (val1,val2) => val1 === val2,
    dateString: (isoStrng)=> new Date(isoStrng).toLocaleDateString(),
};