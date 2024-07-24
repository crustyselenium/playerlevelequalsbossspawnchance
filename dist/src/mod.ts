import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ProfileHelper } from "@spt/helpers/ProfileHelper";
import { ILocations } from "@spt/models/spt/server/ILocations";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";

class Mod implements IPostDBLoadMod, IPreSptLoadMod
{
    private logger: ILogger;
    private databaseServer: DatabaseServer;
    private profileHelper: ProfileHelper;
    private tables: IDatabaseTables;
    private maps: ILocations;

    private modConfig = require("../config/config.json");

    public postDBLoad(container: DependencyContainer): void
    {
        // setup database, maps, and profile interfaces
        this.databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        this.profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
        this.tables = this.databaseServer.getTables();
        this.maps = this.tables.locations;

    }

    public preSptLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");

        if (this.modConfig.enabled){
            staticRouterModService.registerStaticRouter(
                "StaticUpdateBossChance",
                [
                    {
                        // update on raid end
                        url: "/client/match/offline/end",
                        action: (url:string, info:any, sessionId:string, output:string) =>{
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);
                            this.updateBossSpawnChance(currentProfile);
                            this.logger.log("[Lvl=Boss] Boss spawn chances updated", "white");
                            return output;
                        }
                    },{
                        // update on client game start
                        url: "/client/game/start",
                        action: (url:string, info:any, sessionId:string, output:string) =>{
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);
                            this.updateBossSpawnChance(currentProfile);
                            this.logger.log("[Lvl=Boss] Boss spawn chances updated", "white");
                            return output;
                        }
                    }
                ], "aki"
            );
        }
    }

    private updateBossSpawnChance(profile: IPmcData){
        //get player level, default to 1 if it's undefined
        //for math it's rounded up, then maxed out at 100
        const level = profile.Info !== undefined ? profile.Info.Level : 1;
        const debugMessage = this.modConfig.debugSpawnChanceMessages;
        //Customs
        for(const boss of this.modConfig.bossesMultiplier.bigmap){
            for(const mapBoss of this.maps.bigmap.base.BossLocationSpawn){
                if (boss.name === mapBoss.BossName){
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                    if(debugMessage){
                        this.logger.log(`${mapBoss.BossName} changed to ${mapBoss.BossChance}`,"blue");
                    }
                }
            }
        }

        //factory day
        for(const boss of this.modConfig.bossesMultiplier.factory4_day){
            for(const mapBoss of this.maps.factory4_day.base.BossLocationSpawn){
                if (boss.name === mapBoss.BossName){
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                    if(debugMessage){
                        this.logger.log(`${mapBoss.BossName} changed to ${mapBoss.BossChance}`,"blue");
                    }
                }
            }
        }
        //factory night
        for(const boss of this.modConfig.bossesMultiplier.factory4_night){
            for(const mapBoss of this.maps.factory4_night.base.BossLocationSpawn){
                if (boss.name === mapBoss.BossName){
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                    if(debugMessage){
                        this.logger.log(`${mapBoss.BossName} changed to ${mapBoss.BossChance}`,"blue");
                    }
                }
            }
        }

        //interchange
        for(const boss of this.modConfig.bossesMultiplier.interchange){
            for(const mapBoss of this.maps.interchange.base.BossLocationSpawn){
                if (boss.name === mapBoss.BossName){
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                    if(debugMessage){
                        this.logger.log(`${mapBoss.BossName} changed to ${mapBoss.BossChance}`,"blue");
                    }
                }
            }
        }

        //lighthouse
        for(const boss of this.modConfig.bossesMultiplier.lighthouse){
            for(const mapBoss of this.maps.lighthouse.base.BossLocationSpawn){
                if (boss.name === mapBoss.BossName){
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                    if(debugMessage){
                        this.logger.log(`${mapBoss.BossName} changed to ${mapBoss.BossChance}`,"blue");
                    }
                }
            }
        }

        //reserve
        for(const boss of this.modConfig.bossesMultiplier.rezervbase){
            for(const mapBoss of this.maps.rezervbase.base.BossLocationSpawn){
                if (boss.name === mapBoss.BossName){
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                    if(debugMessage){
                        this.logger.log(`${mapBoss.BossName} changed to ${mapBoss.BossChance}`,"blue");
                    }
                }
            }
        }

        //ground zero >20
        for(const boss of this.modConfig.bossesMultiplier.sandbox_high){
            for(const mapBoss of this.maps.sandbox_high.base.BossLocationSpawn){
                if (boss.name === mapBoss.BossName){
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                    if(debugMessage){
                        this.logger.log(`${mapBoss.BossName} changed to ${mapBoss.BossChance}`,"blue");
                    }
                }
            }
        }

        //shoreline
        for(const boss of this.modConfig.bossesMultiplier.shoreline){
            for(const mapBoss of this.maps.shoreline.base.BossLocationSpawn){
                if (boss.name === mapBoss.BossName){
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                    if(debugMessage){
                        this.logger.log(`${mapBoss.BossName} changed to ${mapBoss.BossChance}`,"blue");
                    }
                }
            }
        }

        //streets
        for(const boss of this.modConfig.bossesMultiplier.tarkovstreets){
            for(const mapBoss of this.maps.tarkovstreets.base.BossLocationSpawn){
                if (boss.name === mapBoss.BossName){
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                    if(debugMessage){
                        this.logger.log(`${mapBoss.BossName} changed to ${mapBoss.BossChance}`,"blue");
                    }
                }
            }
        }

        //woods
        for(const boss of this.modConfig.bossesMultiplier.woods){
            for(const mapBoss of this.maps.woods.base.BossLocationSpawn){
                if (boss.name === mapBoss.BossName){
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                    if(debugMessage){
                        this.logger.log(`${mapBoss.BossName} changed to ${mapBoss.BossChance}`,"blue");
                    }
                }
            }
        }
        
    }
}
export const mod = new Mod();
