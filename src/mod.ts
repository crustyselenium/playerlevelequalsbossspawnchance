import type { DependencyContainer } from "tsyringe";

import type { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import type { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import type { DatabaseServer } from "@spt/servers/DatabaseServer";
import type { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import type { ProfileHelper } from "@spt/helpers/ProfileHelper";
import type { ILocations } from "@spt/models/spt/server/ILocations";
import type { IPmcData } from "@spt/models/eft/common/IPmcData";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import type { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import type { PreSptModLoader } from "@spt/loaders/PreSptModLoader";

class Mod implements IPostDBLoadMod, IPreSptLoadMod
{
    private logger: ILogger;
    private databaseServer: DatabaseServer;
    private profileHelper: ProfileHelper;
    private tables: IDatabaseTables;
    private maps: ILocations;

    private modConfig = require("../config/config.json");
    private advancedConfig = require("../config/advancedConfig.json");

    public postDBLoad(container: DependencyContainer): void
    {
        // setup database, maps, and profile interfaces
        this.databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        this.profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
        this.tables = this.databaseServer.getTables();
        this.maps = this.tables.locations;

    }

    public preSptLoad(container: DependencyContainer): void 
    {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        //Check for incompatible mods (Swag, betterspawns)
        const presptModLoader = container.resolve<PreSptModLoader>("PreSptModLoader");
        if (this.modConfig.enabled && presptModLoader.getImportedModsNames().includes("SWAG")) 
        {
            this.logger.log("[Lvl=Boss] INCOMPATIBLE MOD DETECTED: SWAG. DISABLING [Lvl=Boss] FUNCTION", "red");
            this.modConfig.enabled = false;
        }
        if (this.modConfig.enabled && presptModLoader.getImportedModsNames().includes("PreyToLive-BetterSpawnsPlus")) 
        {
            this.logger.log("[Lvl=Boss] INCOMPATIBLE MOD DETECTED: Better Spawns Plus. DISABLING [Lvl=Boss] FUNCTION", "red");
            this.modConfig.enabled = false;
        }


        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");

        if (this.modConfig.enabled)
        {
            staticRouterModService.registerStaticRouter(
                "StaticUpdateBossChance",
                [
                    {
                        // update on raid end
                        url: "/client/match/offline/end",
                        action: (url:string, info:any, sessionId:string, output:string) =>
                        {
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);
                            this.updateBossSpawnChance(currentProfile);
                            this.logger.log("[Lvl=Boss] Boss spawn chances updated", "white");
                            return output;
                        }
                    },{
                        // update on client game start
                        url: "/client/game/start",
                        action: (url:string, info:any, sessionId:string, output:string) =>
                        {
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

    private calculatePMCLevel(profile: IPmcData)
    {
        const playerLevel = profile.Info !== undefined ? profile.Info.Level : 1;
        if (this.advancedConfig.advancedEnabled)
        {
            const sigmoidSpread = this.advancedConfig.sigmoidFunctionParameters.QuarterPercentLevelSpreadSigmoid / 1.098;
            const maxChance = this.advancedConfig.sigmoidFunctionParameters.MaxSpawnPercentage;
            const halfChance = this.advancedConfig.sigmoidFunctionParameters.levelToHaveHalfPercentSpawnChance;
            const sigmoidRightLeft = halfChance / sigmoidSpread;
            // god i hate this
            return (maxChance / (1 + Math.E ** -((playerLevel/sigmoidSpread)-sigmoidRightLeft)));
        }
        return playerLevel;
    }

    private updateBossSpawnChance(profile: IPmcData)
    {
        //get player level, default to 1 if it's undefined
        //for math it's rounded up, then maxed out at 100
        const level = this.calculatePMCLevel(profile);
        const debugMessage = this.modConfig.debugSpawnChanceMessages;
        //Customs
        for (const boss of this.modConfig.bossesMultiplier.bigmap)
        {
            for (const mapBoss of this.maps.bigmap.base.BossLocationSpawn)
            {
                if (boss.name === mapBoss.BossName && boss.enabled)
                {
                    if (debugMessage)
                    {
                        this.logger.log(`Customs: ${mapBoss.BossName} changed ${mapBoss.BossChance} => ${Math.min(Math.ceil(level * boss.multiplier), 100)}`,"blue");
                    }
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                }
            }
        }

        //factory day
        for (const boss of this.modConfig.bossesMultiplier.factory4_day)
        {
            for (const mapBoss of this.maps.factory4_day.base.BossLocationSpawn)
            {
                if (boss.name === mapBoss.BossName && boss.enabled)
                {
                    if (debugMessage)
                    {
                        this.logger.log(`Day Factory: ${mapBoss.BossName} changed ${mapBoss.BossChance} => ${Math.min(Math.ceil(level * boss.multiplier), 100)}`,"blue");
                    }
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                }
            }
        }
        //factory night
        for (const boss of this.modConfig.bossesMultiplier.factory4_night)
        {
            for (const mapBoss of this.maps.factory4_night.base.BossLocationSpawn)
            {
                if (boss.name === mapBoss.BossName && boss.enabled)
                {
                    if (debugMessage)
                    {
                        this.logger.log(`Night Factory: ${mapBoss.BossName} changed ${mapBoss.BossChance} => ${Math.min(Math.ceil(level * boss.multiplier), 100)}`,"blue");
                    }
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                }
            }
        }

        //interchange
        for (const boss of this.modConfig.bossesMultiplier.interchange)
        {
            for (const mapBoss of this.maps.interchange.base.BossLocationSpawn)
            {
                if (boss.name === mapBoss.BossName && boss.enabled)
                {
                    if (debugMessage)
                    {
                        this.logger.log(`Interchange: ${mapBoss.BossName} changed ${mapBoss.BossChance} => ${Math.min(Math.ceil(level * boss.multiplier), 100)}`,"blue");
                    }
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                }
            }
        }

        //lighthouse
        for (const boss of this.modConfig.bossesMultiplier.lighthouse)
        {
            for (const mapBoss of this.maps.lighthouse.base.BossLocationSpawn)
            {
                if (boss.name === mapBoss.BossName && boss.enabled)
                {
                    if (debugMessage)
                    {
                        this.logger.log(`Lighthouse: ${mapBoss.BossName} changed ${mapBoss.BossChance} => ${Math.min(Math.ceil(level * boss.multiplier), 100)}`,"blue");
                    }
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                }
            }
        }

        //reserve
        for (const boss of this.modConfig.bossesMultiplier.rezervbase)
        {
            for (const mapBoss of this.maps.rezervbase.base.BossLocationSpawn)
            {
                if (boss.name === mapBoss.BossName && boss.enabled)
                {
                    if (debugMessage)
                    {
                        this.logger.log(`Reserve: ${mapBoss.BossName} changed ${mapBoss.BossChance} => ${Math.min(Math.ceil(level * boss.multiplier), 100)}`,"blue");
                    }
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                }
            }
        }

        //ground zero >20
        for (const boss of this.modConfig.bossesMultiplier.sandbox_high)
        {
            for (const mapBoss of this.maps.sandbox_high.base.BossLocationSpawn)
            {
                if (boss.name === mapBoss.BossName && boss.enabled)
                {
                    if (debugMessage)
                    {
                        this.logger.log(`>20lvl Ground Zero: ${mapBoss.BossName} changed ${mapBoss.BossChance} => ${Math.min(Math.ceil(level * boss.multiplier), 100)}`,"blue");
                    }
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                }
            }
        }

        //shoreline
        for (const boss of this.modConfig.bossesMultiplier.shoreline)
        {
            for (const mapBoss of this.maps.shoreline.base.BossLocationSpawn)
            {
                if (boss.name === mapBoss.BossName && boss.enabled)
                {
                    if (debugMessage)
                    {
                        this.logger.log(`Shoreline: ${mapBoss.BossName} changed ${mapBoss.BossChance} => ${Math.min(Math.ceil(level * boss.multiplier), 100)}`,"blue");
                    }
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                }
            }
        }

        //streets
        for (const boss of this.modConfig.bossesMultiplier.tarkovstreets)
        {
            for (const mapBoss of this.maps.tarkovstreets.base.BossLocationSpawn)
            {
                if (boss.name === mapBoss.BossName && boss.enabled)
                {
                    if (debugMessage)
                    {
                        this.logger.log(`Streets: ${mapBoss.BossName} changed ${mapBoss.BossChance} => ${Math.min(Math.ceil(level * boss.multiplier), 100)}`,"blue");
                    }
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                }
            }
        }

        //woods
        for (const boss of this.modConfig.bossesMultiplier.woods)
        {
            for (const mapBoss of this.maps.woods.base.BossLocationSpawn)
            {
                if (boss.name === mapBoss.BossName && boss.enabled)
                {
                    if (debugMessage)
                    {
                        this.logger.log(`Woods: ${mapBoss.BossName} changed ${mapBoss.BossChance} => ${Math.min(Math.ceil(level * boss.multiplier), 100)}`,"blue");
                    }
                    mapBoss.BossChance = Math.min(Math.ceil(level * boss.multiplier), 100);
                }
            }
        }
        
    }
}
export const mod = new Mod();
