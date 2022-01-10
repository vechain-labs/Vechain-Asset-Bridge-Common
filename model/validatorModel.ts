import { getConnection, getManager, getRepository } from "typeorm";
import { ActionData, ActionResult } from "../utils/components/actionResult";
import { Validator } from "../utils/types/validator";
import { ValidatorEntity } from "./entities/validator.entity";

export default class ValidatorModel {

    public async getValidators():Promise<ActionData<Validator[]>>{
        let result = new ActionData<Validator[]>();
        result.data = new Array<Validator>();

        try {
            let data = await getRepository(ValidatorEntity)
                .createQueryBuilder()
                .where("status = true")
                .getMany();
            for(const entity of data){
                let _new:Validator = {
                    validator:entity.validator,
                    status:entity.status,
                    update:entity.update,
                    updateBlock:entity.updateBlock
                }
                result.data.push(_new);
            }

        } catch (error) {
            result.error = new Error(`getValidators faild: ${JSON.stringify(error)}`);
        }
        
        return result;
    }

    public async save(validators:Validator[]):Promise<ActionResult>{
        let result = new ActionResult();
        try {
            await getManager().transaction(async trans => {
                for(const verifier of validators){
                    let entity = new ValidatorEntity();
                    entity.validator = verifier.validator;
                    entity.status = verifier.status;
                    entity.update = verifier.update;
                    entity.updateBlock = verifier.updateBlock;
                    await trans.save(entity);
                }
            });
        } catch (error) {
            result.error = error;
        }
        return result;
    }
}