export function ObjectSet(obj:any,path:string,value:any):any {
    var schema = obj;
    var pList = path.split('.');
    var len = pList.length;
    for(var i = 0; i < len-1; i++) {
        var elem = pList[i];
        if( !schema[elem] ) schema[elem] = {}
        schema = schema[elem];
    }
    schema[pList[len-1]] = value;
    return schema;
}