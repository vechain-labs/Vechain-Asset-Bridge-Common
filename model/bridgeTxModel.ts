import { DataSource, Equal} from "typeorm";
import { ActionData, ActionResult } from "../utils/components/actionResult";
import { BlockRange } from "../utils/types/blockRange";
import { BridgeSnapshoot } from "../utils/types/bridgeSnapshoot";
import { BaseBridgeTx,SwapBridgeTx,ClaimBridgeTx, bridgeTxId, BridgeTxType, amountOut } from "../utils/types/bridgeTx";
import { BridgeTxEntity } from "./entities/bridgeTx.entity";

export default class BridgeTxModel{
    constructor(env:any){
        this.dataSource = env.dataSource;
    }

    public async saveBridgeTxs(txs:BaseBridgeTx[]):Promise<ActionResult>{
        let result = new ActionResult();

        try {
            await this.dataSource.transaction(async trans => {
                for(const tx of txs){
                    let entity = new BridgeTxEntity();
                    entity.bridgeTxId = bridgeTxId(tx);
                    entity.chainName = tx.chainName;
                    entity.chainId = tx.chainId;
                    entity.blockNum = tx.blockNumber;
                    entity.blockId = tx.blockId;
                    entity.txid = tx.txid;
                    entity.index = tx.index;
                    entity.token = tx.token;
                    entity.amount = '0x' + tx.amount.toString(16);
                    entity.timestamp = tx.timestamp;
                    entity.recipient = tx.recipient;
                    entity.swapTxHash = tx.swapTxHash;
                    if(tx.type == BridgeTxType.swap){
                        entity.type = 1;
                        entity.from = (tx as SwapBridgeTx).from;
                        entity.reward = '0x' + (tx as SwapBridgeTx).reward.toString(16);
                        entity.amountOut = '0x' + (tx as SwapBridgeTx).amount.toString(16);
                        entity.swapCount = '0x' + (tx as SwapBridgeTx).swapCount.toString(16);
                    } else {
                        entity.type = 2;
                        entity.from = '';
                        entity.reward = '0x0';
                        entity.amountOut = '0x0';
                        entity.swapCount = "0x0";
                    }
                    await trans.save(entity);
                }
            })
        } catch (error) {
            result.error = error;
        }
        return result;
    }

    public async getLastBridgeTx(chainName:string,chainId:string):Promise<ActionData<BaseBridgeTx>>{
        let result = new ActionData<BaseBridgeTx>();

        try {
            let data = await this.dataSource.getRepository(BridgeTxEntity)
            .findOne({
                where:{
                    chainName:Equal(chainName),
                    chainId:Equal(chainId)
                },
                order:{
                    timestamp:"DESC"
                }
            })

            if(data != undefined){
                let tx:BaseBridgeTx = {
                    bridgeTxId:data.bridgeTxId,
                    chainName:data.chainName,
                    chainId:data.chainId,
                    blockNumber:data.blockNum,
                    blockId:data.blockId,
                    txid:data.txid,
                    index:data.index,
                    token:data.token,
                    amount:BigInt(data.amount),
                    timestamp:data.timestamp,
                    recipient:data.recipient,
                    type:data.type,
                    swapTxHash:data.swapTxHash
                }
                if(tx.type == BridgeTxType.swap){
                    (tx as SwapBridgeTx).from = data.from;
                    (tx as SwapBridgeTx).reward = BigInt(data.reward);
                    (tx as SwapBridgeTx).amountOut = BigInt(data.amountOut);
                    (tx as SwapBridgeTx).swapCount = BigInt(data.swapCount);
                }
                result.data = tx;
            }
        } catch (error) {
            result.error = error;
        }

        return result;
    }

    public async getBridgeTxById(bridgetxid:string):Promise<ActionData<BaseBridgeTx>>{
        let result = new ActionData<BaseBridgeTx>();

        try {
            let data = await this.dataSource.getRepository(BridgeTxEntity)
            .findOne({
                where:{
                    bridgeTxId:Equal(bridgetxid)
                }
            });

            if(data != undefined){
                let tx:BaseBridgeTx = {
                    bridgeTxId:data.bridgeTxId,
                    chainName:data.chainName,
                    chainId:data.chainId,
                    blockNumber:data.blockNum,
                    blockId:data.blockId,
                    txid:data.txid,
                    index:data.index,
                    token:data.token,
                    amount:BigInt(data.amount),
                    timestamp:data.timestamp,
                    recipient:data.recipient,
                    type:data.type,
                    swapTxHash:data.swapTxHash
                }
                if(tx.type == BridgeTxType.swap){
                    (tx as SwapBridgeTx).from = data.from;
                    (tx as SwapBridgeTx).reward = BigInt(data.reward);
                    (tx as SwapBridgeTx).amountOut = BigInt(data.amountOut);
                    (tx as SwapBridgeTx).swapCount = BigInt(data.swapCount);
                }
                result.data = tx;
            }
        } catch (error) {
            result.error = error;
        }

        return result;
    }

    public async getClaimTxs(chainName:string,chainId:string,account:string,token?:string,begin?:number,end?:number,limit:number = 50,offset:number = 0):Promise<ActionData<ClaimBridgeTx[]>>{
        let result = new ActionData<ClaimBridgeTx[]>();
        result.data = new Array();

        try {
            let query = this.dataSource.getRepository(BridgeTxEntity)
            .createQueryBuilder()
            .where("chainname = :name",{name:chainName})
            .andWhere("chainid = :id",{id:chainId})
            .andWhere("account = :account",{account:account.toLowerCase()})
            .andWhere("type = 2")
            .andWhere("valid = true")
            .orderBy("timestamp","DESC")
            .offset(offset)
            .limit(limit);

            query = begin != undefined ? query.andWhere("blocknumber >= :begin", {begin:begin}) : query;
            query = end != undefined ? query.andWhere("blocknumber <= :end", {end:end}) : query;
            query = token != undefined ? query.andWhere("token = :token",{token:token.toLowerCase()}) : query;

            const datas:BridgeTxEntity[] = await query.getMany();
        
            for(const data of datas){
                let claimTx:ClaimBridgeTx = {
                    bridgeTxId:data.bridgeTxId,
                    chainName:data.chainName,
                    chainId:data.chainId,
                    blockNumber:data.blockNum,
                    blockId:data.blockId,
                    txid:data.txid,
                    index:data.index,
                    token:data.token,
                    amount:BigInt(data.amount),
                    timestamp:data.timestamp,
                    recipient:data.recipient,
                    type:BridgeTxType.claim,
                    swapTxHash:data.swapTxHash
                };
                result.data.push(claimTx);
            }
        } catch (error) {
            result.error = error;
        }

        return result;
    }

    public async getSwapTxs(chainName:string,chainId:string,account:string,token?:string,begin?:number,end?:number,limit?:number,offset:number = 0):Promise<ActionData<SwapBridgeTx[]>>{
        let result = new ActionData<SwapBridgeTx[]>();
        result.data = new Array();

        try {
            let query = this.dataSource.getRepository(BridgeTxEntity)
            .createQueryBuilder()
            .where("chainname = :name",{name:chainName})
            .andWhere("chainid = :id",{id:chainId})
            .andWhere("account = :account",{account:account.toLowerCase()})
            .andWhere("type = 1")
            .andWhere("valid = true")
            .orderBy("timestamp","DESC")
            .offset(offset)
            .limit(limit);

            query = begin != undefined ? query.andWhere("blocknumber >= :begin", {begin:begin}) : query;
            query = end != undefined ? query.andWhere("blocknumber <= :end", {end:end}) : query;
            query = token != undefined ?  query.andWhere("token = :token",{token:token.toLowerCase()}) :query;

            const data:BridgeTxEntity[] = await query.getMany();

            for(const item of data){
                let bridgeTx:SwapBridgeTx = {
                    bridgeTxId:item.bridgeTxId,
                    chainName:item.chainName,
                    chainId:item.chainId,
                    blockNumber:item.blockNum,
                    blockId:item.blockId,
                    txid:item.txid,
                    index:item.index,
                    token:item.token,
                    amount:BigInt(item.amount),
                    timestamp:item.timestamp,
                    recipient:item.recipient,
                    type:BridgeTxType.swap,
                    from:item.from,
                    reward:BigInt(item.reward),
                    amountOut:BigInt(item.amountOut),
                    swapCount:BigInt(item.swapCount),
                    swapTxHash:item.swapTxHash
                    };
                bridgeTx.amountOut = amountOut(bridgeTx);
                result.data.push(bridgeTx);
            }
        } catch (error) {
            result.error = error;
        }

        return result;
    }

    public async getBridgeTxsBySnapshoot(sn:BridgeSnapshoot,limit?:number,offset:number = 0):Promise<ActionData<BaseBridgeTx[]>>{
        let result = new ActionData<BaseBridgeTx[]>();
        result.data = new Array();

        try {
            for(const chain of sn.chains){
                let query = this.dataSource.getRepository(BridgeTxEntity)
                .createQueryBuilder()
                .where("chainname = :name",{name:chain.chainName})
                .andWhere("chainid = :id",{id:chain.chainId})
                .andWhere("blocknumber >= :begin",{begin:chain.beginBlockNum})
                .andWhere("blocknumber <= :end",{end:chain.endBlockNum - 1})
                .andWhere("valid = true")
                .limit(limit)
                .offset(offset)
                const data:BridgeTxEntity[] = await query.getMany();
                for(const item of data){
                    let bridgeTx:BaseBridgeTx = {
                        bridgeTxId:item.bridgeTxId,
                        chainName:item.chainName,
                        chainId:item.chainId,
                        blockNumber:item.blockNum,
                        blockId:item.blockId,
                        txid:item.txid,
                        index:item.index,
                        token:item.token,
                        amount:BigInt(item.amount),
                        timestamp:item.timestamp,
                        recipient:item.recipient,
                        type:item.type,
                        swapTxHash:item.swapTxHash
                        };
                    if(bridgeTx.type == BridgeTxType.swap){
                        (bridgeTx as SwapBridgeTx).from = item.from;
                        (bridgeTx as SwapBridgeTx).reward = BigInt(item.reward);
                        (bridgeTx as SwapBridgeTx).amountOut = BigInt(item.amountOut);
                        (bridgeTx as SwapBridgeTx).swapCount = BigInt(item.swapCount);
                        (bridgeTx as SwapBridgeTx).amountOut = amountOut(bridgeTx as SwapBridgeTx);
                    }
                    result.data.push(bridgeTx);
                }
            }
        } catch (error) {
            result.error = error;
        }
        return result;
    }

    public async removeByBlockRange(chainName:string,chainId:string,range:BlockRange):Promise<ActionResult>{
        let result = new ActionResult();

        try {
            await this.dataSource.transaction(async trans => {
                let query = trans.createQueryBuilder()
                    .delete()
                    .from(BridgeTxEntity)
                    .where('chainname = :name',{name:chainName})
                    .andWhere('chainid = :id',{id:chainId});
                
                if((range.blockids != undefined && range.blockids.length > 0) || range.blockNum?.from != undefined || range.blockNum?.to != undefined){
                    query = range.blockNum != undefined && range.blockNum.from != undefined ? query.andWhere("blocknum >= :num",{num:range.blockNum.from}) : query;
                    query = range.blockNum != undefined && range.blockNum.to != undefined ? query.andWhere("blocknum <= :num",{num:range.blockNum.to}) : query;
                    query = range.blockids != undefined && range.blockids.length > 0 ? query.andWhere("blockid IN (:list)",{list:range.blockids}) : query;
                    await query.execute();
                }
            });
        } catch (error) {
            result.error = error;
        }

        return result;
    }

    private dataSource:DataSource;
}