CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` varchar(128) NOT NULL,
	`sportKey` varchar(64) NOT NULL,
	`homeTeam` varchar(128) NOT NULL,
	`awayTeam` varchar(128) NOT NULL,
	`commenceTime` timestamp NOT NULL,
	`betType` enum('moneyline','spread','total','parlay') NOT NULL,
	`selection` varchar(256) NOT NULL,
	`odds` decimal(8,2) NOT NULL,
	`stake` decimal(10,2) NOT NULL,
	`potentialPayout` decimal(12,2) NOT NULL,
	`status` enum('pending','won','lost','push','cancelled') NOT NULL DEFAULT 'pending',
	`result` text,
	`settledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sportKey` varchar(64) NOT NULL,
	`modelName` varchar(64) NOT NULL,
	`totalPredictions` int NOT NULL DEFAULT 0,
	`correctPredictions` int NOT NULL DEFAULT 0,
	`accuracy` decimal(5,4),
	`avgConfidence` decimal(5,4),
	`profitLoss` decimal(12,2) DEFAULT '0.00',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parlay_legs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parlayId` int NOT NULL,
	`eventId` varchar(128) NOT NULL,
	`sportKey` varchar(64) NOT NULL,
	`homeTeam` varchar(128) NOT NULL,
	`awayTeam` varchar(128) NOT NULL,
	`commenceTime` timestamp NOT NULL,
	`betType` enum('moneyline','spread','total') NOT NULL,
	`selection` varchar(256) NOT NULL,
	`odds` decimal(8,2) NOT NULL,
	`status` enum('pending','won','lost','push') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parlay_legs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parlays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stake` decimal(10,2) NOT NULL,
	`combinedOdds` decimal(10,2) NOT NULL,
	`potentialPayout` decimal(12,2) NOT NULL,
	`status` enum('pending','won','lost','push','cancelled') NOT NULL DEFAULT 'pending',
	`settledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parlays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(128) NOT NULL,
	`sportKey` varchar(64) NOT NULL,
	`homeTeam` varchar(128) NOT NULL,
	`awayTeam` varchar(128) NOT NULL,
	`commenceTime` timestamp NOT NULL,
	`predictedWinner` varchar(128),
	`homeWinProbability` decimal(5,4),
	`awayWinProbability` decimal(5,4),
	`drawProbability` decimal(5,4),
	`predictedHomeScore` decimal(5,2),
	`predictedAwayScore` decimal(5,2),
	`confidence` decimal(5,4),
	`valueRating` enum('strong_value','moderate_value','fair_value','poor_value'),
	`modelUsed` varchar(64),
	`rationale` text,
	`isCorrect` boolean,
	`actualResult` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`riskTolerance` enum('conservative','moderate','aggressive') NOT NULL DEFAULT 'moderate',
	`favoriteSports` json,
	`maxBetAmount` decimal(10,2) DEFAULT '100.00',
	`dailyBetLimit` decimal(10,2) DEFAULT '500.00',
	`notificationsEnabled` boolean DEFAULT true,
	`responsibleGamblingAcknowledged` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','withdrawal','bet_placed','bet_won','bet_lost','bet_refund') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`balanceAfter` decimal(12,2) NOT NULL,
	`referenceId` int,
	`referenceType` varchar(32),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(12,2) NOT NULL DEFAULT '10000.00',
	`totalDeposited` decimal(12,2) NOT NULL DEFAULT '10000.00',
	`totalWithdrawn` decimal(12,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
