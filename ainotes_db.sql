/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.19-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: ainotes_db
-- ------------------------------------------------------
-- Server version	10.11.19-MariaDB-0+deb12u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `helpdesk`
--

DROP TABLE IF EXISTS `helpdesk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `helpdesk` (
  `id` varchar(36) NOT NULL,
  `helpdesk_id` varchar(50) DEFAULT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `assignee` varchar(100) DEFAULT NULL,
  `in_progress_count` int(11) DEFAULT NULL,
  `completed_count` int(11) DEFAULT NULL,
  `testing_count` int(11) DEFAULT NULL,
  `not_started_count` int(11) DEFAULT NULL,
  `create_date_time` varchar(100) DEFAULT NULL,
  `period_from` date DEFAULT NULL,
  `period_to` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `helpdesk`
--

LOCK TABLES `helpdesk` WRITE;
/*!40000 ALTER TABLE `helpdesk` DISABLE KEYS */;
INSERT INTO `helpdesk` VALUES
('162190e8-5d57-4491-a08b-65cdcc8bf7f9','HD-202606-B8C6B8CB','KHEMA Hospital Toul Kork','DA Phadenphorakden',5,20,0,1,'2026-06-03T21:05:00.000Z','2026-05-20','2026-06-04'),
('193a8c55-d9ff-47c5-9914-b7ce7524073c','HD-202610-940C74DB','KHEMA Hospital Toul Kork','DA Phadenphorakden',3,52,0,1,'2026-10-14T20:23:00.000Z','2026-09-01','2026-10-30'),
('3b8cb321-a20f-4d89-a641-339fc6d75fd1','HD-202607-F57752D3','KHEMA Polyclinic','NY Chhunheang',1,11,0,0,'2026-07-07T17:20:00.000Z','2026-07-08','2026-07-15'),
('4204a5cc-a27c-4b2a-9ed1-da900f0c32ea','HD-202605-F59EF795','Sakal Polyclinic Street 2004','Mon Sopheab',1,22,0,0,'2026-05-05T07:46:00.000Z','2026-01-01','2026-05-05'),
('54a8f742-2bd4-459f-959e-b40d383e1354','HD-202607-E1842005','Sakal Polyclinic Street 2004','Ly Bunnarith',2,22,0,0,'2026-07-08T00:18:00.000Z','2026-06-20','2026-07-08'),
('6034c06e-c1d8-45da-9fc2-319571dd3593','HD-202605-AED48651','KHEMA Hospital Toul Kork','DA Phadenphorakden',12,134,6,6,'2026-05-04T10:37:00.000Z','2026-01-01','2026-05-05'),
('61a5e738-2a91-4dda-ae71-8961d8848ff4','HD-202606-A5968012','KHEMA Polyclinic','NY Chhunheang',1,16,0,0,'2026-06-03T21:03:00.000Z','2026-05-20','2026-06-04'),
('641c8bdc-d965-424a-a76f-178d09743f47','HD-202606-59E93522','Sakal Polyclinic Street 2004','Mon Sopheab',0,9,0,0,'2026-06-03T21:02:00.000Z','2026-05-20','2026-06-04'),
('64b94001-4d15-433c-81ee-79632b79464f','HD-202605-D9014C46','Sakal Polyclinic Street 2004','Ly Bunnarith',12,36,0,14,'2026-05-04T17:45:00.000Z','2026-01-01','2026-05-05'),
('6b375729-c27c-4744-9866-593aa1e97428','HD-202605-6E721252','KHEMA Polyclinic','NY Chhunheang',8,43,0,0,'2026-05-05T00:39:00.000Z','2026-01-01','2026-05-05'),
('73320194-614e-4070-897a-aa05813181a8','HD-202606-D33B412C','Sakal Polyclinic Street 2004','Ly Bunnarith',1,20,0,0,'2026-06-03T21:04:00.000Z','2026-05-20','2026-06-04'),
('8db81e10-9b87-4c1c-93ff-805141f6f233','HD-202610-C7A1C816','Sakal Polyclinic Street 2004','Mon Sopheab',0,28,0,0,'2026-10-14T20:42:00.000Z','2026-09-01','2026-09-30'),
('ae4d30d6-7789-4a1b-8a50-f819dcc66d5b','HD-202610-1D788AB4','KHEMA Polyclinic','NY Chhunheang',0,58,0,0,'2026-10-14T20:31:00.000Z','2026-09-01','2026-09-30'),
('bad08535-cd9f-4512-bdf4-e1656fa3f64d','HD-202607-D8C6484C','Sakal Polyclinic Street 2004','Mon Sopheab',0,11,0,0,'2026-07-08T00:20:00.000Z','2026-06-20','2026-07-08'),
('ccc65a64-2937-4918-b5a4-9b61dddb5005','HD-202607-FACA87FD','KHEMA Hospital Toul Kork','DA Phadenphorakden',3,17,0,1,'2026-07-08T00:18:00.000Z','2026-06-20','2026-07-08'),
('d7bf3894-c3f0-4fe4-9cd2-086244800d19','HD-202605-DCFFDC01','KHEMA GLOBAL CO.,LTD','Chun Braseth',4,6,0,3,'2026-05-04T17:36:00.000Z','2026-01-01','2026-05-05'),
('e7e4d70f-9ebe-4eba-af4e-ff490f18348e','HD-202610-3895A79E','Sakal Polyclinic Street 2004','Ly Bunnarith',2,49,0,1,'2026-10-14T20:32:00.000Z','2026-09-01','2026-09-30');
/*!40000 ALTER TABLE `helpdesk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `helpesk`
--

DROP TABLE IF EXISTS `helpesk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `helpesk` (
  `id` varchar(36) NOT NULL,
  `helpdesk_id` varchar(50) DEFAULT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `assignee` varchar(100) DEFAULT NULL,
  `in_progress_count` int(11) DEFAULT NULL,
  `completed_count` int(11) DEFAULT NULL,
  `testing_count` int(11) DEFAULT NULL,
  `not_started_count` int(11) DEFAULT NULL,
  `create_date_time` varchar(100) DEFAULT NULL,
  `period_from` date DEFAULT NULL,
  `period_to` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `helpesk`
--

LOCK TABLES `helpesk` WRITE;
/*!40000 ALTER TABLE `helpesk` DISABLE KEYS */;
/*!40000 ALTER TABLE `helpesk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL,
  `invoice_no` varchar(50) DEFAULT NULL,
  `date` varchar(50) DEFAULT NULL,
  `billed_to` text DEFAULT NULL,
  `from_address` text DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`items`)),
  `total` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `user_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES
('0e880ee6-1e5d-4613-b290-f9bbbb20344d','ITC-0168','02 June, 2026','Adroit Infosystems, Inc\n10808 S River Front Pkwy # 3130\nSouth Jordan, UT 84095\nUnited States\nmanoj.verma@adroitinfosystems.com','Chun Braseth\nNo.B04,Trung Morn, Street,Sangkat chom chao 1, Khan porsenchey, Phnom Penh, Cambodia.\nPostal Code: 120914.\nprorseth@gmail.com','[{\"id\":1781682835199,\"name\":\"IT consulting services for software support/development\",\"qty\":2,\"price\":100}]',200.00,'Payoneer','Thank you for choosing us!','657ac3f8-e200-4877-b2e3-e4da11fd9617','2026-06-12 05:15:07');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_asset_categories`
--

DROP TABLE IF EXISTS `it_asset_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_asset_categories` (
  `id` varchar(36) NOT NULL,
  `category_name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_asset_categories`
--

LOCK TABLES `it_asset_categories` WRITE;
/*!40000 ALTER TABLE `it_asset_categories` DISABLE KEYS */;
INSERT INTO `it_asset_categories` VALUES
('25e448ec-80e0-4416-98e5-c502fc44c272','CCTV','CCTV','2026-05-07 09:09:05'),
('42921f46-e011-43c9-9a3e-27eed8757a96','Network','Routers, Switches, Access Points','2026-05-05 09:15:00'),
('593eca37-e6c4-40b0-994c-d0feae366b52','Server','Application Servers, Database Servers','2026-05-05 09:15:00'),
('67f3d617-3bfe-4a9c-bc72-7b7c3afe48f5','Peripheral','Keyboards, Mice, Monitors, Printers,UPS,Access door,AirCon, Camera','2026-05-05 09:15:00'),
('85a3596c-6b0b-4cc2-8324-f4cb59488f55','Software','OS Licenses, Utility Software','2026-05-05 09:15:00'),
('a6e31326-07dc-495e-9077-650ddca70622','Storages','cloud storage,local storages','2026-05-05 09:15:49'),
('d22e3d38-4ffa-4641-8bd5-172f9cc3019b','Laptop','Laptops','2026-05-05 09:17:00'),
('d85303b0-be02-4b47-9436-635971e8abdc','Computer','Desktops,AIO','2026-05-05 09:15:00');
/*!40000 ALTER TABLE `it_asset_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_asset_history`
--

DROP TABLE IF EXISTS `it_asset_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_asset_history` (
  `id` varchar(36) NOT NULL,
  `asset_id` varchar(36) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT NULL,
  `old_assignee` varchar(100) DEFAULT NULL,
  `new_assignee` varchar(100) DEFAULT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `old_site` varchar(100) DEFAULT NULL,
  `new_site` varchar(100) DEFAULT NULL,
  `old_location` varchar(150) DEFAULT NULL,
  `new_location` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_asset_history`
--

LOCK TABLES `it_asset_history` WRITE;
/*!40000 ALTER TABLE `it_asset_history` DISABLE KEYS */;
INSERT INTO `it_asset_history` VALUES
('010d5569-abcd-40d7-abab-2b6c54414b1f','03873dcd-9320-4923-8f95-24b7d26cb4e6','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:15',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('011912fd-7fd3-42c2-965a-b34c73e956db','3afbda1d-227f-41b8-a50c-98869e4adc45','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'K1P4 Servcer Room'),
('012b04dc-f1a0-44bc-820c-7d5f97199185','fc5e0ef4-304e-4b53-b68b-276b2407c84d','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'N/A'),
('0180983f-50c4-49fa-963f-a147ec74d6fd','98035706-ecac-44aa-8223-90faacac06a4','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','K1FGRICU','K1FGRICU'),
('01d486e1-9260-4218-a81a-75d26bc6ad73','8f964b71-c230-4ca7-8d39-6a22cc8c6496','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','Medical Stock','Medical Stock'),
('0274fab9-e513-43bc-9345-eef1ee171eba','9228a5a9-e38c-4426-adf0-d1cb761a60e9','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:16',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('02d26d98-80d9-466e-bc82-2d5cfd4de640','cf72013d-788a-4268-8cd9-14770dd207f5','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:12',NULL,'KHEMA Polyclinic',NULL,'Pharmacy right'),
('030e8992-709d-4afe-8e5e-f00a4a18d99b','0410f39f-6854-4db7-9e74-f7786ea9b54a','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:03',NULL,'KHEMA TK',NULL,'Pharmacy Room'),
('032c3532-f0b0-4926-bb59-be0b3a492053','5f2064c6-9c37-4500-85f3-5e6f59a08c88','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:15','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('0332b582-a977-45dc-9932-5fec033416c1','8a6c6f75-8332-4d26-b59c-fe2ed2cdaf73','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','Display','Display'),
('03f9d20c-5039-4d9d-a844-a87f15d46d89','a2e38f14-8914-4705-a547-43fb02439793','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'Laboratory R server'),
('044f2385-a1de-4efe-a0ab-249d6c496e3a','54cdb4f0-0295-4ca9-812e-787e3d2c82f4','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','Endo','Endo'),
('04934556-70ee-4f16-98ae-021461a88e69','e62c9bef-3eb9-49f5-a185-3e57db612ed0','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:41','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','Legarden office-Head HR ','Legarden office-Head HR '),
('056d68f2-5c35-4417-82da-6aed757e7593','9739a47f-cc18-4740-af2a-ff6c0c7f7ba3','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:43',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'FIN'),
('05d37eac-1f12-4a77-8d61-355af65b401b','8df77ab2-7848-46ab-b944-1ebf0ef64cfa','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:52',NULL,'Sakal Polyclinic Street 2004',NULL,'GM PC(Move to Pediatrics)1F'),
('05e8d2e1-8274-45d9-9827-919ecb1b71f5','1c78c247-8bf7-4998-97e3-dbe400650061','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:47','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 Treatment Room','K1P3 Treatment Room'),
('061b3aa8-cfe7-43f4-a9d7-7dee09aa2755','72c53bf9-a7b2-4b64-bb6b-75d50779d03b','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('062cd9a4-5e93-4b14-abed-1f19525f5c81','bd61bc28-5424-4c77-b177-1e6bba6c99e1','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'Administration Office'),
('06719d57-6a04-44bf-9eb6-1c6f518a27c2','cf503a35-8631-42f3-825e-6d742aef7757','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:50',NULL,'Sakal Polyclinic Street 2004',NULL,'K3F2-Nurse'),
('07b43f4b-d7dd-4500-9d71-ac1b7a3aa813','353642c7-bcaa-46f6-8d3e-625407f5b275','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:54',NULL,'Sakal Polyclinic Street 2004',NULL,'Stock F4'),
('084117eb-1087-47b2-8cb1-c4b8a1f3f06f','4d734f94-03ab-43b9-bb8a-cab350534e07','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:01',NULL,'KHEMA TK',NULL,'K1P3 Administrator Office'),
('08a37ccd-6370-49b9-9b62-c81c23616688','38c9381e-86c6-4d77-bdcf-98b9c333a8f6','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:31:06','KHEMA Polyclinic','KHEMA  Polyclinic','IT room','IT room'),
('0959c50b-9d10-4ac5-a33c-50e992efdf1e','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:36:56','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('09c29a11-77b5-4693-85ba-0b5cffc5f845','42a94141-8684-4b16-b7db-77c55de73cb0','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:54',NULL,'Sakal Polyclinic Street 2004',NULL,'Stock F4'),
('09c8ccfa-8d1f-4370-a3db-4909531b32a9','7bf36e5d-6aee-4b7c-bd8f-735bf0816077','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:43',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'Procurement Manager '),
('0a04ec06-b8fa-457f-951b-ea670de0a363','369b2695-e586-4bb0-9f19-5ac43aaef00e','Transferred Asset','Braseth Official','',NULL,'Active',NULL,'','2026-05-07 09:10:51','KHEMA Hospital Toul Kork','Sakal Polyclinic Street 2004','Transfer to K3',' Relationship Officer'),
('0a3d8a80-e759-4123-a528-bdee72e95830','aa196813-512f-4a51-93a3-99d40d8ef354','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:29:06','KHEMA Polyclinic','KHEMA  Polyclinic','Nurse Station','Nurse Station'),
('0a9ca2b0-2d86-4fba-909c-1c0561acd548','a85e554b-5a2b-49d1-b3c1-f1e5c9e1634f','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:27:49','KHEMA Polyclinic','KHEMA  Polyclinic','Desneyland','Desneyland'),
('0b38e64d-3b78-4e5e-82da-d3e69d1a7183','f1e7eb4a-4388-42d5-9249-30d69769e19a','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:14','KHEMA Polyclinic','KHEMA Polyclinic','Doctor Lounge L','Doctor Lounge L'),
('0c3fb20e-d943-4bc3-b27f-b666f551e114','8df77ab2-7848-46ab-b944-1ebf0ef64cfa','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:36','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','GM PC(Move to Pediatrics)1F','GM PC(Move to Pediatrics)1F'),
('0c6bd8a6-ba4d-44ae-a6b7-1fe2eb8c3543','7dc41574-9d8a-4102-a1a5-1035051a27ff','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:52',NULL,'Sakal Polyclinic Street 2004',NULL,'CUSTOMER SERVICE COUNTER'),
('0d04025d-2958-42de-a591-fb4e263ea5e0','22ed9c7b-3c4d-445b-98ac-f8da8691fd44','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'K1P3 Pediatrics Consultation'),
('0d3aad27-593a-4a30-9dc5-366f84f12954','7862b2ba-db1e-412a-883a-a375fdb00c70','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'K3 Server Room'),
('0e868bbd-c485-488a-908f-7c232ca65b67','ab04ae5a-000d-4de3-ad43-7921e15c2217','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:53',NULL,'Sakal Polyclinic Street 2004',NULL,'K1'),
('0ebc82e9-78c5-4e9d-8df2-57578d33718e','72c53bf9-a7b2-4b64-bb6b-75d50779d03b','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:16',NULL,'KHEMA Polyclinic',NULL,'Marketing Room'),
('0f6106d4-9492-4c35-aecc-9a38591fe6f9','615581db-5cce-4c98-89fe-7731f1a03797','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'MT Room'),
('0f932e51-a9df-41dc-94fb-0bb5bd760c70','626de88f-d7ba-4404-827b-d5566f4ff713','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','NURSE COUNTER Floor 3','NURSE COUNTER Floor 3'),
('105af173-df13-4f74-9e1e-5fcd1f434f1e','1f1288c2-aa4e-488d-9646-bc421f3f219c','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'Medical Stock'),
('105cdb21-f4bd-4625-b90d-5ed2dea563ba','491d5d18-7308-4c90-a2b1-bf0eba31df11','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','Gynecologist Room','Nurse Station'),
('109b88ac-f310-4a3f-9e7f-6594c35a029d','473f9e4e-1b5d-4270-93a6-e5577d00a995','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','Admin Officer','Admin Officer'),
('109de19e-2805-4d22-aa05-5422be5f25ab','4ca32c40-d49f-4b48-842d-01b5b4291463','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','K1FGRICU','K1FGRICU'),
('10a35831-a032-4cea-bdea-a107255d736c','e5a6b75e-63f3-4e99-b0de-8f51c20268a1','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'Nurse Station 2F'),
('10db86f4-2185-48d6-a966-2365adb3b42f','773e6af6-61c9-48b8-a679-49047289e5a1','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('11748a48-390e-4c88-9898-8e2559131bcc','dfd1e1e1-3adb-4425-b295-9673ffa9628b','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'K1FGRICU'),
('12694419-2966-46d0-92c6-1d28a9f783b3','4cb512f9-b48f-498a-916c-8bc30e6fb8e2','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:23:53','KHEMA Polyclinic','KHEMA  Polyclinic','IT','IT'),
('12904df7-10d1-4202-a4d9-9ea9d836c45e','e5df5517-449c-4f0c-baf8-d6ab602a041d','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:42','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','K1P3 Nurse Station','K1P3 Nurse Station'),
('129b8c1f-dd60-4dd5-94fa-1f6f9d0c8bbf','93094518-a392-435e-ba6f-09e718362b55','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'Administration Office'),
('12a5ca69-0e9a-4111-a8fc-6baeeedc427b','4cf10155-e5f8-4ae1-b9a5-b1b95d61e5fc','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:15','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('130625e8-39ce-4d48-b4f0-e12a39db41b5','f67a88df-1280-42d5-bc71-47a1864bc982','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','CT-Scan','CT-Scan'),
('130d3b34-996f-442e-bf55-0920323bdcbc','085d137b-4d95-4fc0-b47b-8e016917a468','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:41','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','Accounting (Phai Nor)','Accounting (Phai Nor)'),
('1369f51f-cba7-4b9c-90de-5f96bcc0fdbf','e996203f-f85e-4cd6-acdf-effe05a12f40','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:14',NULL,'KHEMA Polyclinic',NULL,'Singapore'),
('13c274e5-2e9b-454f-970c-7278d3c488aa','f78418ac-e353-404f-b8c2-f492a13afe7c','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:27:26','KHEMA Polyclinic','KHEMA  Polyclinic','Server','Server'),
('14b47f1d-2430-418b-a205-e05eae44a013','e4205286-bb04-4857-aaea-c60247afc3a7','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:03',NULL,'KHEMA TK',NULL,'K1P3 Server room'),
('15a35adb-dedf-498c-b30c-7091316a13a4','67b5b803-b1dc-48c4-865d-4b8540ab9935','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:29:20','KHEMA Polyclinic','KHEMA  Polyclinic','Doctor lounge','Doctor lounge'),
('15a6b49a-a47a-4e65-aa45-45d21f73c8af','72c53bf9-a7b2-4b64-bb6b-75d50779d03b','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:20','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('16280b39-b0c9-4ecd-b951-e635faf69670','54cdb4f0-0295-4ca9-812e-787e3d2c82f4','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','Endo','Endo'),
('164dd7f6-cb0d-4cd7-b857-49a2a82056bf','ee6dda5c-fb2b-45bd-b816-dcd43ce3fa8f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:20','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('16aec09d-dd93-4c31-9e44-2be83432d621','bd61bc28-5424-4c77-b177-1e6bba6c99e1','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','Administration Office','Administration Office'),
('1707d00f-c50a-42c7-b379-2d5e9e8a98ca','500fcc8a-f867-4da7-9286-ea4a468906da','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:25:23','KHEMA Polyclinic','KHEMA  Polyclinic','Display','Display'),
('170b81a4-1bde-47e8-9e81-63eadacab85f','df07e4cb-d647-42ad-a0d5-87ae7bc2adab','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:42','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','Sakal Relationship Manager','Sakal Relationship Manager'),
('17b9a0c0-87fd-4384-ba89-1a6fe0a2a6ad','82402fed-5413-4976-bf18-66f55dd948bd','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('17d38537-24a6-4409-a68c-c040beddc31a','5163b589-6b7c-4827-b361-7eb289368d57','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','Cashier GF','Cashier GF'),
('17d49b4a-6dfc-4429-bb69-330e0bad8d11','cedba394-180a-4c23-90be-4f143f5fe0cd','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'K1 Laboratory Room'),
('18115e64-da1a-4dcf-a1cf-c843d857f6ec','e996203f-f85e-4cd6-acdf-effe05a12f40','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:08','KHEMA Polyclinic','KHEMA Polyclinic','Singapore','Singapore'),
('18268ab8-a922-402f-a3e2-17ba0f2e1d6e','afbed313-5a74-4a59-bf5e-3be59925f564','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:29:02','KHEMA Polyclinic','KHEMA  Polyclinic','PC Supervisor','PC Supervisor'),
('18b7fa69-b848-4fb1-ada2-97656ea949f4','60982e4b-cf01-4842-9de3-9b7a4ab3543e','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','Cardiology Room','Cardiology Room'),
('18fa022c-906c-41af-a63c-1a66956bbdbf','824f1658-b08e-4d6b-a314-c15ee339f335','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'Nurse Station 1F'),
('18fa50a7-c762-4fe6-a5c2-f409565f1873','03873dcd-9320-4923-8f95-24b7d26cb4e6','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA  Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('1922ce5a-59d5-4187-9b48-d1903e093639','7d735f2a-451a-47f7-ac25-fb9ebbea3768','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:03',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('193ec782-daab-4979-ab02-ae46860cdb88','0b83acc3-3f39-4d57-b920-d05d9974f14f','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:29:49','KHEMA Polyclinic','KHEMA  Polyclinic','Nurse Station','Nurse Station'),
('194c42fe-757d-493c-a405-c811b4234b23','330728e5-92cb-4cc0-b6c3-daa9d3318dae','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'IT-Office'),
('1adfc92f-60fd-4a29-989a-7755f5ea4e3f','38c9381e-86c6-4d77-bdcf-98b9c333a8f6','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:07','KHEMA Polyclinic','KHEMA Polyclinic','IT room','IT room'),
('1b75011d-0b1b-4d4f-b361-ab991e606096','82402fed-5413-4976-bf18-66f55dd948bd','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('1b7e36cd-6328-4f3d-a80a-395af0481e02','4560cead-74b2-4e17-bab8-3152f40616dd','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','K1FGRICU','K1FGRICU'),
('1b86bd66-48fa-4491-82e3-1f224336910f','338fed14-8181-4ec9-9e4f-2fe4c12da90d','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:49',NULL,'Sakal Polyclinic Street 2004',NULL,'ER-NursePC2'),
('1bb3df7d-5203-4114-a819-4cb6f3ce4ff0','54cdb4f0-0295-4ca9-812e-787e3d2c82f4','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:16',NULL,'KHEMA Polyclinic',NULL,'Endo'),
('1bc15261-80c7-4421-bcaf-3ccbeb75fe9e','1e02fca7-50b3-41b4-b1e4-d4cbc7d2e71c','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:07','KHEMA Polyclinic','KHEMA Polyclinic','IT room','IT room'),
('1bd49777-feb3-4540-97b3-30da0e7dedca','085d137b-4d95-4fc0-b47b-8e016917a468','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'Accounting (Phai Nor)'),
('1c155f6f-73a9-443b-bbd4-fb060e783f2f','3cb5e7be-78c9-4a2a-9740-f6b110a63d56','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:40','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','Chief account SAKAL','Chief account SAKAL'),
('1c295a15-8b89-4475-a949-83ff6e001fe6','7b880445-c104-4f59-9d0d-d2680988f643','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Stock F4','Stock F4'),
('1c689152-725c-473d-9d84-614a37ef5bde','99a58774-5fdf-4573-afca-b72ae10744b4','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','Pharmacy center','Pharmacy center'),
('1d870823-73d3-41e4-b4a3-bbde2910d7ad','430a8a50-5830-41a8-8b60-f902142a15a8','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:35','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','IPD2-PC1','IPD2-PC1'),
('1db94d21-d93e-4465-abdd-955697bcc1cc','96e7b983-4152-4f7b-85ee-a646b550860e','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','Pharmacy Room','Pharmacy Room'),
('1dd49889-b174-45c5-948a-c4ed4aadd123','96443ce1-af6e-4981-82b1-7a997608af4f','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:53',NULL,'Sakal Polyclinic Street 2004',NULL,'BILLING COUNTER'),
('1e5234af-e7ce-4c3e-86ba-92cc30eada07','a85e554b-5a2b-49d1-b3c1-f1e5c9e1634f','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA  Polyclinic','KHEMA Polyclinic','Desneyland','Desneyland'),
('1e5c8999-8ac2-42bb-b34f-3a1cfbd6447c','eef0d69c-d5bf-4b9f-a0ee-d45b4fd83159','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:53',NULL,'Sakal Polyclinic Street 2004',NULL,'Stock F4'),
('1eb8652f-63b7-4098-baed-4278bb487022','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:17:17','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('1f3d58cb-6181-4fbd-8be9-ba9c349d0b3a','2a1abafb-34c4-4f15-af52-dcbc1843ac40','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:18','KHEMA Polyclinic','KHEMA Polyclinic','Relationship','Relationship'),
('1f5314a4-f1e8-4a7e-b7ea-3750f4997833','4d032be0-887e-4719-87d2-519f97781b04','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:21','KHEMA Polyclinic','KHEMA Polyclinic','Meeting','Meeting'),
('1f989ecf-dec3-459b-83cb-d9e423255c4f','500fcc8a-f867-4da7-9286-ea4a468906da','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:21','KHEMA Polyclinic','KHEMA Polyclinic','Display','Display'),
('1fea89b0-81ac-4084-8d23-a8b2278e073a','e91306f5-0dd7-4952-a514-09f170d63415','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'K1P3 CT Scan Room'),
('201b1194-a2a1-41e0-9d0c-6d044ab4202a','0c188d35-5850-485b-89c5-eaeab616c97a','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Laboratory L','Laboratory L'),
('203584f1-f2ea-4d72-9d7a-ebe2fe9738c7','d3e37e15-eda4-41d5-a6d5-b4213b378133','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'OPD NURSE STATION PC2'),
('20696c27-b9fb-4841-9f49-bab9fc41dba6','3a9ad1d8-efd2-4df3-885a-503970c80db6','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 Billing','K1P3 Billing'),
('20b07777-ee7c-4377-a098-7b5cc5eb6ade','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:20','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('20b5e391-9f99-4e96-8ef9-742b63b22957','f67a88df-1280-42d5-bc71-47a1864bc982','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','CT-Scan','CT-Scan'),
('211c6f5e-27ba-497d-8627-507fead729b6','0c188d35-5850-485b-89c5-eaeab616c97a','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','Laboratory L','Laboratory L'),
('212d7b28-48b4-4674-b13c-16c9e7034ac1','12131758-0acf-4b9b-bdd1-9b73f7d7d88f','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:23:09','KHEMA Polyclinic','KHEMA  Polyclinic','Meeting Room','Meeting Room'),
('2152c26f-ccfb-493a-af8f-6f643ff2986f','b8af354e-7aef-4ef5-a770-8534ab8ef467','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'Server Room'),
('21b912f1-56a4-45cf-bbe2-6f50fe0ba965','c2f5e0b4-e365-4a67-b480-ffc07af43f22','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:53',NULL,'Sakal Polyclinic Street 2004',NULL,'NURSE COUNTER Floor 4'),
('22ca77fd-1fac-4258-bd93-8f7a3cb0fc30','36e49592-22e0-453c-a7ac-218f5494b4b1','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'Accounting (Nam Sreyroth)'),
('2313ad81-82be-480d-b4bd-9c06b69bc812','965cc9fc-fff8-4be8-a9c9-3e7223dfe4a3','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:17',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('23324482-3448-4447-8b0e-38064ebea2dc','d5052d98-de53-4e17-968f-1c521a3cf779','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA  Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('238c9fe4-9bbf-48cc-a86c-0b051a7fdf0b','ee6dda5c-fb2b-45bd-b816-dcd43ce3fa8f','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:16',NULL,'KHEMA Polyclinic',NULL,'Marketing Room'),
('23e2db29-9201-4c8d-8fe1-45add28bfcc8','7f4d3152-e276-4c06-81ed-ed72bd57130f','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'ER Nurse Station'),
('23e7c8a5-d814-4e9d-9e43-db7390183ee2','d4f9ad09-df3f-474c-bdd8-ff85b87991c8','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','Admin Officer','Admin Officer'),
('250b05df-8070-4851-a38b-8245a04d7265','afbed313-5a74-4a59-bf5e-3be59925f564','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:15',NULL,'KHEMA Polyclinic',NULL,'PC Supervisor'),
('251a95f9-6144-47de-8336-cc12f18384d9','d4f9ad09-df3f-474c-bdd8-ff85b87991c8','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:28:05','KHEMA Polyclinic','KHEMA  Polyclinic','Admin Officer','Admin Officer'),
('264063b7-f3e5-46be-a7b2-a16701f2fbfe','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:41','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','Marketing&Sale Director KG','Marketing&Sale Director KG'),
('2685166d-ec86-4549-96b3-74ff2c5f7cdf','c7fd3e60-896a-429e-a8c4-678acb74db7e','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','Billing front right','Billing front right'),
('27a59f4a-8257-41af-a8a0-29694cd98466','3b721875-c689-4b04-a332-8b93cb3a32a5','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:14','KHEMA  Polyclinic','KHEMA Polyclinic','CT-Scan R','CT-Scan R'),
('27ea8fd1-00a3-47fd-8963-d583cbc45ff2','4c545a11-7742-475f-916f-0dea7e3f364b','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:19','KHEMA  Polyclinic','KHEMA Polyclinic','Display','Display'),
('280122e9-af42-4905-b440-931a9f629d9a','a85e554b-5a2b-49d1-b3c1-f1e5c9e1634f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:20','KHEMA Polyclinic','KHEMA Polyclinic','Desneyland','Desneyland'),
('28a91f2b-ea1c-43b8-8507-e561a9b80db6','353642c7-bcaa-46f6-8d3e-625407f5b275','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:38','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Stock F4','Stock F4'),
('28f07b5f-3530-4179-b32b-51e463481da7','ab04ae5a-000d-4de3-ad43-7921e15c2217','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','K1','K1'),
('296e07ca-27b9-47d7-aba1-a6f24fd8c6c9','318cb519-5a94-4566-b8e1-05e35eb834e7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:08','KHEMA Polyclinic','KHEMA Polyclinic','Echocardiography','Echocardiography'),
('29f0f2eb-e8da-47c1-8853-cadb49d5890b','e7e0b3fe-e94c-4373-ade7-fe913d9235b1','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:36','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Sakal AR','Sakal AR'),
('2a5d80c2-1ac6-4b0d-98d4-56d883c3fc48','a85e554b-5a2b-49d1-b3c1-f1e5c9e1634f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','Desneyland','Desneyland'),
('2a994b8f-8529-41f9-95e1-3b018b2b0468','add5b636-2cb7-4f74-b241-87bf34d46c5f','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:21:12',NULL,'KHEMA Polyclinic',NULL,'Meeting Room'),
('2ad849c2-c467-4779-b1a1-58a519ad1a29','4a2b46d3-0ab9-4802-8ca2-05425742c046','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','K12FRHemo','K12FRHemo'),
('2afc7ca8-89bf-4a8d-8bca-e8896f53ccd2','42a94141-8684-4b16-b7db-77c55de73cb0','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:38','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Stock F4','Stock F4'),
('2bae16f7-1335-41cb-b69a-fbd31c008a89','4a7cce36-2044-449d-8c8e-3ead5211bd60','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:18','KHEMA Polyclinic','KHEMA Polyclinic','Stock Controller','Stock Controller'),
('2bb5ad99-b82c-49d3-947e-f83c40602ec7','3a37e11f-ffe8-4be0-988e-882903aa910c','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:01',NULL,'KHEMA TK',NULL,'OPD NURSE STATION PC1'),
('2c13a89d-37bf-461c-98b6-c6d121ecf678','73365d71-a258-4050-a8b9-2a226c7731ec','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:03',NULL,'KHEMA TK',NULL,'Keeping in locker '),
('2ce6bc0f-844c-4638-9396-23451fe00b7f','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('2d26a112-8821-4d2c-8ad0-ebaa7832dd63','f27a740a-f210-415c-b3d7-bf56d9e5fff3','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:03',NULL,'KHEMA TK',NULL,'Ground Floor Patient Lounge K1P4'),
('2d40ad88-25fe-48b5-b8e2-180a4804a2a8','e520ee5c-6c39-4130-8c39-d0253acb4075','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'K1P4 OR Room'),
('2e6c6f34-b7b0-47c8-8f78-000e946a3952','a6de1fb6-d128-4015-92de-0a22a8fcdd89','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:14',NULL,'KHEMA Polyclinic',NULL,'London Room'),
('2eb6b82d-617d-4c88-8e24-8f28f447ebbd','da067572-0f95-40e5-9f8d-4009e76758ee','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','Nurse station 3F','Nurse station 3F'),
('2f25e125-e592-4f54-952a-c187825bd4dc','5c6ee4e9-f886-47e1-87bb-296d0ce8ae33','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:42','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','KG-COO','KG-COO'),
('2f9744b8-c3f5-44f0-bf28-4c57a3041dfb','4cf10155-e5f8-4ae1-b9a5-b1b95d61e5fc','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('2f9af0d2-2451-417a-aa0d-0a6870c1d5f6','9fad4590-4d0d-40f9-9eae-72cec53bf916','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 Pediatrics Urgent Room','K1P3 Pediatrics Urgent Room'),
('2fce7672-9af0-490c-a560-f51df3dee5e2','9a94f268-7ca8-44cb-8493-3cf952194a27','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Billing front left','Billing front left'),
('2fe9afcd-0fa0-441f-9f29-cfa6abcb19ec','0c862bdd-7901-4cdc-a4b2-fedf0769b082','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','Billing back Left','Billing back Left'),
('302338ab-567e-4f97-9cd2-503204c22ffc','29ae9c4f-89dd-40e2-9afb-7b6309f09ce4','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:14',NULL,'KHEMA Polyclinic',NULL,'Appointment Center'),
('3095ad7a-56d9-4544-a80d-51225d234af8','efdf9b57-9ff4-4243-a32d-54b9702e8d52','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:40','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','K1P3 Meeting Room','K1P3 Meeting Room'),
('30bfed8c-7d13-4f1e-9a84-965a0adce03f','7bf36e5d-6aee-4b7c-bd8f-735bf0816077','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:41','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','Procurement Manager ','Procurement Manager '),
('30f4cbbc-c335-47b6-aab0-7e7de9ddece0','73238c59-55b0-4fcf-8a6f-088a624acc44','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:18',NULL,'KHEMA Polyclinic',NULL,'IT room'),
('313a811d-4908-4e4b-82f2-f45b03f1ab19','1be76a13-360b-4599-b0d7-cecfe227d31b','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 09:18:36','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','IPD1-PC2','Relationship-Officer'),
('31b4fdc0-7cd4-4e18-acfd-8fffc24848a9','afbed313-5a74-4a59-bf5e-3be59925f564','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','PC Supervisor','PC Supervisor'),
('31d66460-7320-4a9a-85ad-770f26761909','36933e84-4fb1-4b73-842e-afc65b203897','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','Pharmacy Room','Pharmacy Room'),
('32d6b04d-91b6-46c8-b6ef-d36d959be366','6c331b42-c7db-40f9-98c2-785af6c1e0ea','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','GI Endoscopy Room','GI Endoscopy Room'),
('332b8a64-4b62-4289-a1ef-f67e71181154','aa6fe63b-e119-4a3c-9f0b-6dabeef3b815','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','Doctor Lounge R','Doctor Lounge R'),
('3372ae8e-103d-45be-88b9-1dfa694ee577','1f1288c2-aa4e-488d-9646-bc421f3f219c','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','Medical Stock','Medical Stock'),
('33f40e2f-1450-4b70-9d45-faba2ddd4072','be168c20-4f20-4919-abaf-4b74013a7622','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('3407c1d6-2310-4f44-a6e1-0ae16c3986d0','98ca011c-4e15-489e-b643-e99b284f05cf','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA  Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('3414cc55-eb2b-4725-9a66-0fec484de023','c337f5a7-0417-4421-8410-abc052a471d5','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:41','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','Accounting (Kunnaroth)','Accounting (Kunnaroth)'),
('342e7519-7ae1-4833-b3a9-63b3c1e597b9','d6e2fe3e-94e9-473b-86a7-510694e8c500','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','K3F1-Xray','K3F1-Xray'),
('348c8bcb-00eb-4738-8d32-6e54a50cca61','93cee1f1-2c3d-4a93-9c0c-16f7331ca9e4','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','Accountant Office','Accountant Office'),
('34bbe8e5-5bd3-4e24-b9c3-6550173aa065','c2f5e0b4-e365-4a67-b480-ffc07af43f22','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','NURSE COUNTER Floor 4','NURSE COUNTER Floor 4'),
('35088a00-946b-42a2-82d8-77712341fa8f','72a1e62a-96ca-4280-bc21-95c4af4f19d3','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'K1 Control Room X-Ray'),
('350d4b55-9de3-4f4a-8def-139e69c4df06','149ad0aa-827f-4595-b28d-274b8d4eb3c5','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('35314764-43c4-4fb4-b769-2aecdf4c4014','df07e4cb-d647-42ad-a0d5-87ae7bc2adab','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:43',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'Sakal Relationship Manager'),
('3704b4b7-5c71-4850-9bf3-6ee8c49431b2','2203f534-dbd3-4406-b1f2-a9dcc9c47996','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:16','KHEMA  Polyclinic','KHEMA Polyclinic','Dr.Khimuy','Dr.Khimuy'),
('372045c2-1a91-4c9a-b532-4d1d13c84fbf','202a0a90-f2f1-4a30-9306-636bb34a959c','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('37a05f3f-1294-4af8-85ee-5816eb8c98ff','7d4ecd42-dba9-424f-9e36-cccd0992189f','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','Nurse station 3F','Nurse station 3F'),
('37e1fad5-f024-4612-8a98-d0a9264d29ff','1c78c247-8bf7-4998-97e3-dbe400650061','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'K1P3 Treatment Room'),
('389a5003-940a-47d2-87f1-5ddd419452c9','7d735f2a-451a-47f7-ac25-fb9ebbea3768','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('38aceda6-a207-4896-97ce-411bb75160fa','3a9ad1d8-efd2-4df3-885a-503970c80db6','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'K1P3 Billing'),
('38d231f8-cd54-45b8-846a-fdbe553b79be','d5052d98-de53-4e17-968f-1c521a3cf779','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:28:55','KHEMA Polyclinic','KHEMA  Polyclinic','Nurse Station','Nurse Station'),
('3a8aefd9-8a46-4bb1-a478-f39999dd7fdb','833ffb4c-6cce-4978-9f4a-e30c455994ba','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:38','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Stock F4','Stock F4'),
('3ab2d12c-4a94-4722-aaa7-868f1b6da11c','8f884818-d1c0-4957-a569-f7d199350a88','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','X-Ray L','X-Ray L'),
('3b46e5a4-8e62-48b5-ae1c-5b2a290d0a6f','ee6dda5c-fb2b-45bd-b816-dcd43ce3fa8f','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA  Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('3b8157a3-7980-4755-84b2-dddd508e01c1','72c53bf9-a7b2-4b64-bb6b-75d50779d03b','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('3beda8f1-47b7-451c-b271-1aa50af5c39d','7704aaec-9131-40df-ad65-3852404a056f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:22','KHEMA Polyclinic','KHEMA Polyclinic','Server Room','Server Room'),
('3c0cf19b-0dfe-45f1-a554-bea31dfd0cee','88193731-d103-4fdb-b1b2-6ee42be50418','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Billing back right','Billing back right'),
('3c604951-f381-4e62-8419-f97687df7c25','f90275f1-474d-4340-ae4f-f908d0a09428','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:53',NULL,'Sakal Polyclinic Street 2004',NULL,'Stock F4'),
('3cb12944-ff3e-4ae2-9f98-86be23c31538','d0652a9f-2b5f-4590-b4fb-b39c283b4bab','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:14',NULL,'KHEMA Polyclinic',NULL,'Pediatrics'),
('3cfcb695-3f40-4e04-8919-9fa00c63b9b5','64604375-50dd-403f-8701-1e662ec17541','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'Cashier GF'),
('3dd38d8e-9803-419f-bb94-1c9b4fe5c7e0','e02d9301-7737-493d-9181-c1f528dd4805','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','GM','GM'),
('3df9eb64-02b1-4367-9bf6-ed90c8ece30c','e0725333-0907-47a7-8306-82fcb43fb72d','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'Medical Stock'),
('3e6d14d7-9c27-474f-9d0f-9b33d6ec0eaa','40d0cd39-20a8-4b12-ab14-08f0d07fd0ba','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:38','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Stock F4','Stock F4'),
('3f8d0440-65e5-41ca-a7bd-a606f136e5d0','afbed313-5a74-4a59-bf5e-3be59925f564','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA  Polyclinic','KHEMA Polyclinic','PC Supervisor','PC Supervisor'),
('40c7f2cd-ac13-4deb-9dc9-b6cb5cb50260','54cdb4f0-0295-4ca9-812e-787e3d2c82f4','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA  Polyclinic','KHEMA Polyclinic','Endo','Endo'),
('41388957-2e39-4c4d-9aca-9112947745f3','e9596f76-42f5-459c-8379-274eb0c76e78','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:50',NULL,'Sakal Polyclinic Street 2004',NULL,'K2F1-Pharmacy1'),
('414c9dc8-3536-405f-a96f-8b82c0b0f326','669ab636-d2ca-43a2-83e7-ec65b24bf3f4','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'Maintenance Room'),
('41a8d5e6-3991-4afa-be27-c225e08886f9','7df7e0e4-f34d-4e52-a06a-5af3263d1118','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:21','KHEMA Polyclinic','KHEMA Polyclinic','IT stock','IT stock'),
('41aa55ca-307e-4f48-95a3-28ab56ad5035','cf07e56f-5bf0-4936-9c05-fa44dd9a99ec','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:47','KHEMA TK','KHEMA Hospital Toul Kork','K1 Laboratory Room','K1 Laboratory Room'),
('41d883a0-4e8f-4abc-9f94-87eb15be36da','9ed32333-b882-4be4-8ae6-a8158b7f33b6','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:18','KHEMA Polyclinic','KHEMA Polyclinic','PhnomPenh','PhnomPenh'),
('421f0f8a-4d72-4804-ab02-5d699a622ad3','9d6c4778-d909-46d7-ac0d-3d3fe99e41dc','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:47','KHEMA TK','KHEMA Hospital Toul Kork','K12FRHemo','K12FRHemo'),
('43bbbbec-0a63-491b-88e0-0e11b07be99f','751e92a7-5820-424b-85f1-450e2c7202a9','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:17',NULL,'KHEMA Polyclinic',NULL,'Server'),
('442dd408-23b9-42a1-921b-ac82debb28a8','3cb5e7be-78c9-4a2a-9740-f6b110a63d56','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'Chief account SAKAL'),
('4543d01d-5208-444b-bdb4-8489e6614bab','e02d9301-7737-493d-9181-c1f528dd4805','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:16','KHEMA  Polyclinic','KHEMA Polyclinic','GM','GM'),
('4560ab25-d5a0-464f-aa29-633394f971aa','c940a6f3-c609-4978-ae89-01477b45b880','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:01',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('46f37b47-571b-49d2-87fc-70307129cf61','47937e22-0b7b-4183-b77f-8bca94ae21eb','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:36','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Home Care K3','Home Care K3'),
('47153233-f57d-4858-9793-42af6ec146de','7f4d3152-e276-4c06-81ed-ed72bd57130f','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','ER Nurse Station','ER Nurse Station'),
('4731e257-afd6-426b-b53d-b3bf9b3984df','82402fed-5413-4976-bf18-66f55dd948bd','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA  Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('47817292-f658-4eac-b52b-0fc91a47bf01','29ae9c4f-89dd-40e2-9afb-7b6309f09ce4','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:08','KHEMA Polyclinic','KHEMA Polyclinic','Appointment Center','Appointment Center'),
('47aaa796-16cf-4c12-ade7-31969bd160a2','38c9381e-86c6-4d77-bdcf-98b9c333a8f6','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:15','KHEMA  Polyclinic','KHEMA Polyclinic','IT room','IT room'),
('47b423c8-5380-41f7-b33b-0f6d6d1ed3e8','cd48891f-611d-4bf1-af6b-e52f7b18bcf9','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA  Polyclinic','KHEMA Polyclinic','Cath Lab','Cath Lab'),
('47bef341-aa66-40a6-8e7a-118b4209693c','965cc9fc-fff8-4be8-a9c9-3e7223dfe4a3','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('47ee39f0-939a-4754-a01c-fe0722dba3e1','9228a5a9-e38c-4426-adf0-d1cb761a60e9','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('496a51c1-d8a2-422a-ade3-b08da6dc6e3a','505ff021-5a49-43b7-9c81-83a540d755b8','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:13','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station R','Nurse Station R'),
('498b5173-ee85-40d9-ac69-1f0cd93ff9ab','60982e4b-cf01-4842-9de3-9b7a4ab3543e','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'Cardiology Room'),
('4a628303-c2aa-4087-9cb5-168ce13f3e55','200814ef-a2a0-43c6-a1b7-fab0ef0e2845','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('4accac73-82ed-4022-8dc7-48ee00f64385','9853080f-5620-412f-a68e-cf6f9e2d91ee','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:01',NULL,'KHEMA TK',NULL,'Nurse station 1F'),
('4af9916d-1e80-43fc-a639-45573dd26ece','500fcc8a-f867-4da7-9286-ea4a468906da','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','Display','Display'),
('4b03cbf8-bf0c-4132-9a5f-45c512e59af7','7f65dfbc-0e78-4584-8526-864ade04f63d','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','Nurse station 2F','Nurse station 2F'),
('4b1ab346-3f9c-47df-a800-bdddc5767eb6','369b2695-e586-4bb0-9f19-5ac43aaef00e','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','Transfer to K3','Transfer to K3'),
('4bdcaaca-9f7b-4ec3-ba7c-22ddcffacf68','d6e2fe3e-94e9-473b-86a7-510694e8c500','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:50',NULL,'Sakal Polyclinic Street 2004',NULL,'K3F1-Xray'),
('4c81cb84-c351-4326-83b1-c1200b1d80b1','3b721875-c689-4b04-a332-8b93cb3a32a5','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'CT-Scan R'),
('4ce6df9c-b8bd-4859-85bc-e19a88ccbc14','dfd1e1e1-3adb-4425-b295-9673ffa9628b','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','K1FGRICU','K1FGRICU'),
('4cffcc30-f99d-4ffa-a22b-0adc6b7f8818','93cee1f1-2c3d-4a93-9c0c-16f7331ca9e4','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'Accountant Office'),
('4d74ba63-e9fa-4201-b49e-46019b64b3b2','615581db-5cce-4c98-89fe-7731f1a03797','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','MT Room','MT Room'),
('4dae7788-639f-49b0-af72-b995cdef175e','0c100323-ce55-4923-919d-19483093abc6','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Back OFFICE','Back OFFICE'),
('4e112b4a-bb9b-4545-80ec-4b557f6d9b8a','73238c59-55b0-4fcf-8a6f-088a624acc44','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:22','KHEMA Polyclinic','KHEMA Polyclinic','IT room','IT room'),
('4f19ec90-b40c-482b-8766-555c76fbbedd','2203f534-dbd3-4406-b1f2-a9dcc9c47996','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:14',NULL,'KHEMA Polyclinic',NULL,'Dr.Khimuy'),
('4f82c369-adf6-4f61-b9e1-0c4fe29d4a0a','f51a258d-c8d2-4203-bac9-1ac7c096e829','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:49',NULL,'Sakal Polyclinic Street 2004',NULL,'K3GF-REGISTER'),
('4fa34083-08d3-4c02-9980-9fe24fa85fb6','add5b636-2cb7-4f74-b241-87bf34d46c5f','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:20','KHEMA  Polyclinic','KHEMA Polyclinic','Meeting Room','Meeting Room'),
('505d6b30-21e8-4602-ba55-9eda06d03ef9','e62c9bef-3eb9-49f5-a185-3e57db612ed0','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'Legarden office-Head HR '),
('50d7d625-0834-4100-b27e-d6cfeb480a44','e91306f5-0dd7-4952-a514-09f170d63415','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 CT Scan Room','K1P3 CT Scan Room'),
('50f735a9-b98e-4892-a6ff-f20ad725c7db','73238c59-55b0-4fcf-8a6f-088a624acc44','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','IT room','IT room'),
('5121114c-2784-4fd3-afac-4021612b88f6','06dc6d9f-8621-4fe2-a126-5d289f166918','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:41','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','KG-CFO','KG-CFO'),
('5150e6f8-20c6-4c17-a757-2ba4537f38c6','312abde0-a6c3-43b4-8d9c-eb73903487ec','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:15','KHEMA Polyclinic','KHEMA Polyclinic','Customer Service','Customer Service'),
('51655446-be9e-4a89-b235-6adb2720bdd5','4d032be0-887e-4719-87d2-519f97781b04','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:19','KHEMA Polyclinic','KHEMA Polyclinic','Meeting','Meeting'),
('524f1a65-05f2-42c1-8714-fba8e5b85050','93094518-a392-435e-ba6f-09e718362b55','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','Administration Office','Administration Office'),
('52a18ec8-cf46-4451-8c0e-b2ac12b5090a','e520ee5c-6c39-4130-8c39-d0253acb4075','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 OR Room','K1P4 OR Room'),
('52bcb3b1-8e7b-4b84-85b5-9274644f15b3','500fcc8a-f867-4da7-9286-ea4a468906da','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:17',NULL,'KHEMA Polyclinic',NULL,'Display'),
('53267787-0147-4cb5-ba75-2e22471ea276','491d5d18-7308-4c90-a2b1-bf0eba31df11','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:30:33','KHEMA Polyclinic','KHEMA  Polyclinic','Gynecologist Room','Gynecologist Room'),
('5355a942-ef5b-4ee8-810f-3d3526a9f2ef','7a14728c-2bf3-4121-b679-cb1ce3ef9732','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'K1FGRICU'),
('536248ea-ac64-4323-8883-da86aad852b0','491d5d18-7308-4c90-a2b1-bf0eba31df11','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:15','KHEMA  Polyclinic','KHEMA Polyclinic','Gynecologist Room','Nurse Station'),
('53c9d7e2-1734-4d84-a423-f46485b0d737','40d0cd39-20a8-4b12-ab14-08f0d07fd0ba','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:54',NULL,'Sakal Polyclinic Street 2004',NULL,'Stock F4'),
('53e72a1a-eb34-400c-bdb1-798195a073e0','7df7e0e4-f34d-4e52-a06a-5af3263d1118','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:17',NULL,'KHEMA Polyclinic',NULL,'IT stock'),
('54b53d1a-c4cb-4bbc-b6f6-9af52dee37c5','459824e8-34d6-4243-aee0-d4179d68725b','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 Administrator Office','K1P3 Administrator Office'),
('559115ce-c41a-4597-a263-68c1b77f0e17','f78418ac-e353-404f-b8c2-f492a13afe7c','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','Server','Server'),
('55ff6d08-728d-46d9-9bf1-25a0a4820039','824f1658-b08e-4d6b-a314-c15ee339f335','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','Nurse Station 1F','Nurse Station 1F'),
('569474fe-5ec6-42a4-a37d-01ea2078d0bd','09d333fc-38b4-4923-9338-3f447f7a18bd','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','Meeting Room','Meeting Room'),
('56afa0e7-ce72-4253-aa33-25ca55ddda31','9fad4590-4d0d-40f9-9eae-72cec53bf916','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'K1P3 Pediatrics Urgent Room'),
('5705c879-9d62-4993-a979-45af31bafeef','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:36','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Home Care K3','Home Care K3'),
('5759f739-d1f3-47e6-8038-5ba4cd9f8a4e','8f964b71-c230-4ca7-8d39-6a22cc8c6496','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'Medical Stock'),
('57674257-122e-425a-bba6-bd93d91c38f4','d5052d98-de53-4e17-968f-1c521a3cf779','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('57b25663-376e-4e7c-ac48-222e3f67a4b8','5c6ee4e9-f886-47e1-87bb-296d0ce8ae33','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:43',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'KG-COO'),
('5836c6be-46e2-43aa-8c20-5bea4cbc1124','505ff021-5a49-43b7-9c81-83a540d755b8','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:05','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station R','Nurse Station R'),
('584339a3-3edb-481a-a74f-66966944ca27','22ed9c7b-3c4d-445b-98ac-f8da8691fd44','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 Pediatrics Consultation','K1P3 Pediatrics Consultation'),
('58bfa0d3-b647-4a58-8e63-a4033d3cc4b9','1e02fca7-50b3-41b4-b1e4-d4cbc7d2e71c','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:15','KHEMA Polyclinic','KHEMA Polyclinic','IT room','IT room'),
('58f2a135-3a9d-4236-9dec-09299e3a46dd','751e92a7-5820-424b-85f1-450e2c7202a9','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','Server','Server'),
('592d54fe-3bf2-4db3-a803-bbc97774f61c','29ae9c4f-89dd-40e2-9afb-7b6309f09ce4','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:28:27','KHEMA Polyclinic','KHEMA  Polyclinic','Appointment Center','Appointment Center'),
('59a70bdd-1b3b-4449-a9ca-449c18519b8e','312abde0-a6c3-43b4-8d9c-eb73903487ec','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:11',NULL,'KHEMA Polyclinic',NULL,'Customer Service'),
('59b82ea4-c5e2-4298-893d-bd37ccee7b95','b264049f-419f-44a2-8954-bcbf2926779c','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:40','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','FIN','FIN'),
('5a74946d-db3d-41b2-8a9f-ae7deb5f787a','b3b4ae2d-fcd9-448c-8bc6-424d569cc2c5','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:04',NULL,'KHEMA TK',NULL,'Ground Floor Patient Lounge K1P4'),
('5b00399f-e6f6-495f-8906-07bd42fc9119','175745e2-d564-4bd3-ae4f-2b65f4336bc8','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:23:36','KHEMA Polyclinic','KHEMA  Polyclinic','IT','IT'),
('5b50b6d3-ae75-48f3-8021-60bc32bb0af3','200814ef-a2a0-43c6-a1b7-fab0ef0e2845','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('5bc62fb2-1aa7-42ff-a8c7-4507a74cc5e1','4d032be0-887e-4719-87d2-519f97781b04','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','Meeting','Meeting'),
('5c33cdd7-dd39-4092-a45e-6f91050fd5c4','7704aaec-9131-40df-ad65-3852404a056f','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:18',NULL,'KHEMA Polyclinic',NULL,'Server Room'),
('5cf70383-d116-42b0-9814-4967b7200472','1be76a13-360b-4599-b0d7-cecfe227d31b','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:35','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','IPD1-PC2','IPD1-PC2'),
('5dd57547-0caf-4223-988c-415bdb716d89','c940a6f3-c609-4978-ae89-01477b45b880','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('5def81b0-18f2-4a65-b386-09318407dd13','7dc41574-9d8a-4102-a1a5-1035051a27ff','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','CUSTOMER SERVICE COUNTER','CUSTOMER SERVICE COUNTER'),
('5e05694e-6e61-4c93-9360-1cee7d21a1d3','0b83acc3-3f39-4d57-b920-d05d9974f14f','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:15',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('5e4a5473-3d90-41c9-8c2e-5825f5c97fb8','eef0d69c-d5bf-4b9f-a0ee-d45b4fd83159','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:38','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Stock F4','Stock F4'),
('5efb5d0d-fa62-44cb-bf8e-74ba91d93e36','fc5cc7c1-84fb-44d4-a2a2-4c7ce5ba5430','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'GF/Doctor Room'),
('5f8ef1f1-6652-4916-a0b5-164c593a95d7','be168c20-4f20-4919-abaf-4b74013a7622','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('5fb7b09e-b6a4-4e5c-9aa2-417c3c0b671b','aa196813-512f-4a51-93a3-99d40d8ef354','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA  Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('5ff8fd04-dd74-44da-9778-562c91ad9baa','fc5cc7c1-84fb-44d4-a2a2-4c7ce5ba5430','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:47','KHEMA TK','KHEMA Hospital Toul Kork','GF/Doctor Room','GF/Doctor Room'),
('60b7f40a-d455-49c3-9b16-49ddd2852d11','d4f9ad09-df3f-474c-bdd8-ff85b87991c8','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA  Polyclinic','KHEMA Polyclinic','Admin Officer','Admin Officer'),
('60bf03db-6ef5-4bac-997e-4249e78849c4','5094234e-4c6c-4a2d-a2a9-b3d3e699fd2a','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','Spacialist & Consultation GF','Spacialist & Consultation GF'),
('60ff5c56-ea03-42b0-a57a-060b01185eca','9228a5a9-e38c-4426-adf0-d1cb761a60e9','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('613699a4-5a1e-4dad-b012-c5c17079f2f3','751e92a7-5820-424b-85f1-450e2c7202a9','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:21','KHEMA Polyclinic','KHEMA Polyclinic','Server','Server'),
('622a865c-4e9f-481d-9200-3e2de147a543','02cef0de-6c08-46ad-9802-82c7fa1c5f92','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:19','KHEMA  Polyclinic','KHEMA Polyclinic','Server Room','Server Room'),
('6243825b-0298-4e35-9eee-f33eef19db79','aa6fe63b-e119-4a3c-9f0b-6dabeef3b815','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:14','KHEMA Polyclinic','KHEMA Polyclinic','Doctor Lounge R','Doctor Lounge R'),
('62ed2f20-c76c-4fe4-8bd0-307bd67aef89','add5b636-2cb7-4f74-b241-87bf34d46c5f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:22','KHEMA Polyclinic','KHEMA Polyclinic','Meeting Room','Meeting Room'),
('63180801-b71d-42b2-89a0-4dffcf44e50f','e4205286-bb04-4857-aaea-c60247afc3a7','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 Server room','K1P3 Server room'),
('636478a3-25eb-4484-b344-d3ff35f6dc35','369b2695-e586-4bb0-9f19-5ac43aaef00e','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:35','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004',' Relationship Officer',' Relationship Officer'),
('63d7060d-5be1-4851-b04c-e950cfec389f','750cf041-a6ca-4348-95ae-9ebccd3eaa5e','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 Customer Service','K1P3 Customer Service'),
('63deb369-413e-4651-a54c-efa286ca7d44','0b83acc3-3f39-4d57-b920-d05d9974f14f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('63fc727f-bccb-4ce6-b0f0-fb922c25c59f','df07e4cb-d647-42ad-a0d5-87ae7bc2adab','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:35','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Junior IT Laptop','Junior IT Laptop'),
('64c6bb9d-2240-4e87-8a51-a73bf435f33e','5439a8f3-cd07-4d9a-a869-b14fd59e9c33','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'K1 Laboratory Room'),
('65502cba-d634-48bf-adbf-514fa0b7adb0','202a0a90-f2f1-4a30-9306-636bb34a959c','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('66b344b9-3f85-411a-9f30-083d65d84036','f1e7eb4a-4388-42d5-9249-30d69769e19a','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Doctor Lounge L','Doctor Lounge L'),
('66c66ebc-0570-4847-9afd-534b03b86e23','a4b20d55-6b48-4229-8283-8d0211db86d8','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','Administration Office','Administration Office'),
('66e36f71-fdee-4346-890c-c6dda9fdaac1','a6de1fb6-d128-4015-92de-0a22a8fcdd89','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:16','KHEMA Polyclinic','KHEMA Polyclinic','London Room','London Room'),
('67223afe-23f1-43b7-b583-4d60705090f3','02cef0de-6c08-46ad-9802-82c7fa1c5f92','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:18',NULL,'KHEMA Polyclinic',NULL,'Server Room'),
('67bf61e1-8661-4027-8de7-b3dca12f3abe','d7ce6c68-fa8c-403c-b9fc-4efa5e1ea909','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','General Consultation - Ultrasound GF','General Consultation - Ultrasound GF'),
('68b40263-032a-4697-bce5-56ccdb0fc2c1','491d5d18-7308-4c90-a2b1-bf0eba31df11','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('6a5ae1a4-b1b2-4142-861c-4082d0b02971','e9e43b92-4e46-4d0e-87bd-b072d8df4e4e','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'K1P4 Servcer Room'),
('6bd44038-c060-448e-aebf-150c1d9cf1c0','02cef0de-6c08-46ad-9802-82c7fa1c5f92','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:22','KHEMA Polyclinic','KHEMA Polyclinic','Server Room','Server Room'),
('6c3b30f4-8c3c-474f-beec-6ebd5f68d30a','887884b7-f5d9-4cec-899f-1a9e93fb5520','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:28:13','KHEMA Polyclinic','KHEMA  Polyclinic','Housekeeper','Housekeeper'),
('6d22106d-d0c3-4c11-9510-2992a788b13b','4c545a11-7742-475f-916f-0dea7e3f364b','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:21','KHEMA Polyclinic','KHEMA Polyclinic','Display','Display'),
('6db94ff3-2d19-4cab-80f7-da582e0dca14','3cb5e7be-78c9-4a2a-9740-f6b110a63d56','Transferred Asset','Braseth Official','',NULL,'Active',NULL,'','2026-05-07 09:10:52','KHEMA GLOBAL CO.,LTD','Sakal Polyclinic Street 2004','Chief account SAKAL','Chief account SAKAL'),
('6e22fd59-a579-4c38-9988-acd95a3ee494','23ebd2df-1227-4fbb-a5e6-5fc0fe24a139','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 Server room','K1P3 Server room'),
('6e510fdb-015b-4413-9030-e2166c04fa60','3e893cdd-2bae-41e4-acbc-bce1b55c8478','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('6eaf74e5-a1f6-4821-b527-8c3bf45cd40c','9739a47f-cc18-4740-af2a-ff6c0c7f7ba3','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:42','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','FIN','FIN'),
('6fee917d-fd6e-4c74-a618-189605692d82','ad34f90d-e6bf-456b-beb6-0d8c1abc7340','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:54',NULL,'Sakal Polyclinic Street 2004',NULL,'Admin Office'),
('6ff61909-9b42-46ad-b654-b569bfdc6d84','0c188d35-5850-485b-89c5-eaeab616c97a','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:14','KHEMA Polyclinic','KHEMA Polyclinic','Laboratory L','Laboratory L'),
('7036f1de-b459-4f8a-ae8b-5d80c46e6215','4cf10155-e5f8-4ae1-b9a5-b1b95d61e5fc','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('7051b8d3-5d43-4041-bb2c-d6cde883efbf','82402fed-5413-4976-bf18-66f55dd948bd','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:29:14','KHEMA Polyclinic','KHEMA  Polyclinic','Nurse Station','Nurse Station'),
('708542fd-faee-4dfe-8978-9e306cf56cdf','03873dcd-9320-4923-8f95-24b7d26cb4e6','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('70f3251d-4ecb-444e-b8aa-3f9b54750bbf','55a66228-6ef1-4e9d-8782-0e6f8089c48e','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:38','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Stock F4','Stock F4'),
('71a09ce8-c70a-41ff-a292-46a8774c8756','67b5b803-b1dc-48c4-865d-4b8540ab9935','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA  Polyclinic','KHEMA Polyclinic','Doctor lounge','Doctor lounge'),
('71cd5bb7-6840-43f2-b6dd-6a78d42f2ed9','833ffb4c-6cce-4978-9f4a-e30c455994ba','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:54',NULL,'Sakal Polyclinic Street 2004',NULL,'Stock F4'),
('72d4d749-0fb4-48ca-b5c2-a7163d9fd359','38c9381e-86c6-4d77-bdcf-98b9c333a8f6','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','IT room','IT room'),
('72e0eb52-96ae-4327-8811-8dc3ad53c90b','2a1abafb-34c4-4f15-af52-dcbc1843ac40','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','Relationship','Relationship'),
('72e1aeb7-ff74-48b8-a7f8-6564f46e3aca','2a1abafb-34c4-4f15-af52-dcbc1843ac40','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:15',NULL,'KHEMA Polyclinic',NULL,'Relationship'),
('72ee4357-ee05-46c2-b44c-5a5a2a73e505','55a66228-6ef1-4e9d-8782-0e6f8089c48e','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:54',NULL,'Sakal Polyclinic Street 2004',NULL,'Stock F4'),
('744098a4-038d-4b0d-a685-49536d536b2a','12131758-0acf-4b9b-bdd1-9b73f7d7d88f','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:18',NULL,'KHEMA Polyclinic',NULL,'Meeting Room'),
('75a49674-74eb-498d-bda1-ba5063b1d83e','0c862bdd-7901-4cdc-a4b2-fedf0769b082','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:12',NULL,'KHEMA Polyclinic',NULL,'Billing back Left'),
('75d95253-d7be-455c-92ae-c46680077d0d','cf07e56f-5bf0-4936-9c05-fa44dd9a99ec','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'K1 Laboratory Room'),
('75f3d7e7-9d85-4723-9b40-5b2aadbd8bfc','f8920fa9-c417-4194-8156-68def9f9adba','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:47','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('7636b8cd-b2ca-4ac8-8eff-0be595e05554','491d5d18-7308-4c90-a2b1-bf0eba31df11','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:07','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Gynecologist Room'),
('7642c31f-11b1-4caa-92eb-c286dad9fbdc','175745e2-d564-4bd3-ae4f-2b65f4336bc8','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('77203426-04a9-45b0-8228-4047afa03127','93d472d8-f4da-49f2-9f5c-ddba264aa9e0','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:16',NULL,'KHEMA Polyclinic',NULL,'Cancer Center'),
('7749913c-4470-430a-a95f-2b79cf0d8f84','f51a258d-c8d2-4203-bac9-1ac7c096e829','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','K3GF-REGISTER','K3GF-REGISTER'),
('77550d9a-76c2-4bc9-bd71-a8b9d7412b6b','96443ce1-af6e-4981-82b1-7a997608af4f','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','BILLING COUNTER','BILLING COUNTER'),
('7767360b-4649-4e5c-8b3c-3e315508ef1e','f67a88df-1280-42d5-bc71-47a1864bc982','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:14','KHEMA Polyclinic','KHEMA Polyclinic','CT-Scan','CT-Scan'),
('778988e0-c683-493b-872e-98007975a93c','d060f5cd-4c69-477f-b784-b472f2b777f2','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'Medical Stock'),
('77d3242c-3eab-462e-8fe6-26ebffd35de7','2be0d8fd-e8d3-4539-bb98-613a43d6d3ca','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','OPD Nurse Station PC1','OPD Nurse Station PC1'),
('77eba024-cbe0-4199-a79c-e2dac8968045','e5a6b75e-63f3-4e99-b0de-8f51c20268a1','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','Nurse Station 2F','Nurse Station 2F'),
('78e2a783-3bf2-4e82-83a5-349146334a34','4a7cce36-2044-449d-8c8e-3ead5211bd60','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:16','KHEMA  Polyclinic','KHEMA Polyclinic','Stock Controller','Stock Controller'),
('78f5a27f-e681-4ecd-afb5-956488809613','87581c15-dd83-4047-88d5-e161de4ceadd','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Billing PC','Billing PC'),
('78fac041-4094-4fb4-a6a3-91d171248312','887884b7-f5d9-4cec-899f-1a9e93fb5520','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:14',NULL,'KHEMA Polyclinic',NULL,'Housekeeper'),
('7a456780-eda1-4fa0-8081-e0200b202882','7704aaec-9131-40df-ad65-3852404a056f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','Server Room','Server Room'),
('7aa4e6ad-1ec8-4c6b-92ab-4008d7f25d12','52e5bc6f-3835-4632-889a-867a37c04841','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','Ground Floor Patient Lounge K1P4','Ground Floor Patient Lounge K1P4'),
('7ad98af1-fb39-4f52-ad16-484625aeae73','72a1e62a-96ca-4280-bc21-95c4af4f19d3','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','K1 Control Room X-Ray','K1 Control Room X-Ray'),
('7ba93786-b800-424b-ba60-6c9ae84f6f96','c7fd3e60-896a-429e-a8c4-678acb74db7e','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Billing front right','Billing front right'),
('7c231cd7-0066-4dc3-9d28-d8e59196839f','3666824f-1b9b-43d4-ad21-45f3724197d0','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:01',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('7c5d9e9c-f195-4be3-8344-881553b1abdc','4c545a11-7742-475f-916f-0dea7e3f364b','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:23:42','KHEMA Polyclinic','KHEMA  Polyclinic','Display','Display'),
('7c722103-9d4f-40ce-a1c3-4c54feefe70e','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:15:39','KHEMA BKK','KHEMA Polyclinic','IT','IT'),
('7db221be-50be-455f-9716-32574730cc39','d0652a9f-2b5f-4590-b4fb-b39c283b4bab','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:07','KHEMA Polyclinic','KHEMA Polyclinic','Pediatrics','Pediatrics'),
('7eeb7a1b-7853-4ab9-8932-2f76e43e0566','8a6c6f75-8332-4d26-b59c-fe2ed2cdaf73','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:21','KHEMA Polyclinic','KHEMA Polyclinic','Display','Display'),
('7f280246-061c-4aaf-a2fc-68a520d45a16','1a3e8dc5-772d-4dfb-953e-a3bfa95f9aa5','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Servcer Room','K1P4 Servcer Room'),
('7f645364-80ac-4f64-8faf-ba8fd85ac28c','97fa80aa-37ed-4e12-8a18-f02ef4f2f4c7','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'K1P3 CT Scan Room'),
('7f9a9b8c-4e12-46cb-9a77-4281f1ffcf00','15af75e1-51e0-46c6-8a21-90856186f5b7','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','BILLINGGF','BILLINGGF'),
('7f9b12c2-0634-48c3-ab5c-a59001e65d07','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:36:56','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('7fe9be3f-5fc7-4b24-a024-63f3c1fb2f08','aa7470a9-dec6-4377-9c55-336f6eb08d70','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'ADM'),
('8025d999-8dd1-446c-bd09-14a2e34a5ed8','aa196813-512f-4a51-93a3-99d40d8ef354','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:15',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('802cce63-ea09-41c6-882e-b9eb09d5da1e','5f2064c6-9c37-4500-85f3-5e6f59a08c88','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('80e3b31d-8043-4694-8ebe-137baca1e8bc','fbb8425f-4357-490b-9b28-e4a0b6bcd600','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:08','KHEMA Polyclinic','KHEMA Polyclinic','Stock Controller','Stock Controller'),
('81d70023-21fd-40bc-a245-d40713214682','e7e0b3fe-e94c-4373-ade7-fe913d9235b1','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:52',NULL,'Sakal Polyclinic Street 2004',NULL,'Sakal AR'),
('81f2ebee-9c71-4676-b7e8-224b99d6d5b0','3b721875-c689-4b04-a332-8b93cb3a32a5','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:30:59','KHEMA Polyclinic','KHEMA  Polyclinic','CT-Scan R','CT-Scan R'),
('81f9a41d-82db-44c7-85ac-c3003a0f2c15','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:17:09','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('83670dcc-91dd-4e66-ab9b-968ac3e98f10','67b5b803-b1dc-48c4-865d-4b8540ab9935','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:15',NULL,'KHEMA Polyclinic',NULL,'Doctor lounge'),
('8370718d-3d85-40e2-86f2-3ff0b6a4ec1c','2de85bc6-c770-4453-93fd-668f445e3068','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:53',NULL,'Sakal Polyclinic Street 2004',NULL,'K1'),
('83c46bc3-fb9b-42ca-b5a5-3aef5717c5d8','4d032be0-887e-4719-87d2-519f97781b04','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:17',NULL,'KHEMA Polyclinic',NULL,'Meeting'),
('84450f2f-3a5a-45b7-852a-1f9937f25bd2','98ca011c-4e15-489e-b643-e99b284f05cf','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:20','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('845c30d4-b67b-45ba-8da7-c62124fcca37','02359daf-9742-423d-ab25-4320df953df3','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:49',NULL,'Sakal Polyclinic Street 2004',NULL,'LAB-Counter'),
('84822f5a-2931-444f-b3b3-8705ae032095','669ab636-d2ca-43a2-83e7-ec65b24bf3f4','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','Maintenance Room','Maintenance Room'),
('849ffc62-3c90-4ed4-bf8b-69931cb1ab15','887884b7-f5d9-4cec-899f-1a9e93fb5520','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:08','KHEMA Polyclinic','KHEMA Polyclinic','Housekeeper','Housekeeper'),
('84e57eab-0cdf-4845-a5cd-fff43a17c069','4a7cce36-2044-449d-8c8e-3ead5211bd60','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:14',NULL,'KHEMA Polyclinic',NULL,'Stock Controller'),
('851bc760-a048-4a42-854c-b025a942f88b','330728e5-92cb-4cc0-b6c3-daa9d3318dae','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','IT-Office','IT-Office'),
('861c59dd-f231-4e6e-afaf-3dc3fc9709d3','491d5d18-7308-4c90-a2b1-bf0eba31df11','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Gynecologist Room'),
('863f7748-abdd-461a-ba38-ba82ace999f9','5439a8f3-cd07-4d9a-a869-b14fd59e9c33','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','K1 Laboratory Room','K1 Laboratory Room'),
('867544ca-0bd7-42a5-afc1-7ac5dc0197d0','655e6c0d-21fd-4acb-9ce8-2e4aaa474bda','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:35','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','3F-IPD-PC2','3F-IPD-PC2'),
('87277dae-b018-4b6a-b130-f54a35d7010b','7b880445-c104-4f59-9d0d-d2680988f643','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:53',NULL,'Sakal Polyclinic Street 2004',NULL,'Stock F4'),
('8757bef2-f829-4001-9717-faeb36ff0b79','52e5bc6f-3835-4632-889a-867a37c04841','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:03',NULL,'KHEMA TK',NULL,'Ground Floor Patient Lounge K1P4'),
('884a5b05-352f-4235-bdb1-7ae35b9a047d','fbb8425f-4357-490b-9b28-e4a0b6bcd600','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:14',NULL,'KHEMA Polyclinic',NULL,'Stock Controller'),
('88b4b73e-fa6e-49d1-bb05-a0265ac066cd','d060f5cd-4c69-477f-b784-b472f2b777f2','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','Medical Stock','Medical Stock'),
('88fc40fe-4ecc-46e7-86ee-632065a087a0','5f2064c6-9c37-4500-85f3-5e6f59a08c88','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:07','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('89016a00-e3b9-41ce-a13a-f711567d5e01','67b5b803-b1dc-48c4-865d-4b8540ab9935','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','Doctor lounge','Doctor lounge'),
('897a4bbf-cfce-4850-9231-0cbaab5cf3a1','ba13f1e5-d77a-445d-a581-19cda575f4dd','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','Cashier GF','Cashier GF'),
('89ebd194-a478-4d21-99d6-d0e4f5cf515e','5867fdce-06e8-4f8e-b82a-23c625a6eae3','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:35','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','IT Support Desktop','IT Support Desktop'),
('8a97818c-d03c-430c-bb0a-e1f079685b5c','7d203b4b-8a16-4bbd-90e6-8d3e5e4654ae','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:35','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Dr-Logue','Dr-Logue'),
('8ae13cee-a84f-4c08-8b8a-c254f66a4da6','d4f9ad09-df3f-474c-bdd8-ff85b87991c8','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:20','KHEMA Polyclinic','KHEMA Polyclinic','Admin Officer','Admin Officer'),
('8b32fa1a-094f-45d4-bc4d-10fc5bf50c0d','0c100323-ce55-4923-919d-19483093abc6','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:53',NULL,'Sakal Polyclinic Street 2004',NULL,'Back OFFICE'),
('8b86978f-90de-4b9c-80cd-1167430a8550','f5b25a0b-833d-446c-921b-856c24addcb6','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:52',NULL,'Sakal Polyclinic Street 2004',NULL,'Home Care K3'),
('8beb794a-7f7f-4dcf-a139-914330c8ba13','02cef0de-6c08-46ad-9802-82c7fa1c5f92','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:22:59','KHEMA Polyclinic','KHEMA  Polyclinic','Server Room','Server Room'),
('8c251579-b240-4e12-ba20-4133aaaaaed7','4cb512f9-b48f-498a-916c-8bc30e6fb8e2','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA  Polyclinic','KHEMA Polyclinic','IT','IT'),
('8c2546b1-c200-4bac-80e9-6557ecb9954e','7f65dfbc-0e78-4584-8526-864ade04f63d','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'Nurse station 2F'),
('8d56bc0b-7136-4158-8504-d3a311eb6a78','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('8d65837b-e888-400c-a88a-90ee9b89b1af','4a2b46d3-0ab9-4802-8ca2-05425742c046','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'K12FRHemo'),
('8d6c539d-6e94-4b37-82d8-3458b9972e3e','c78d5069-db6f-4079-a137-7cfa4260201a','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','Nurse station 1F','Nurse station 1F'),
('8d7d86ff-57b0-4ac4-a481-09e12813c5e5','0c862bdd-7901-4cdc-a4b2-fedf0769b082','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:14','KHEMA Polyclinic','KHEMA Polyclinic','Billing back Left','Billing back Left'),
('8dba4177-0320-4c80-a121-f14284c43f59','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Transferred Asset','Braseth Official','',NULL,'Active',NULL,'','2026-05-07 09:10:52','KHEMA Polyclinic','Sakal Polyclinic Street 2004','IT','Home Care K3'),
('8dde9f61-6eda-4110-99db-80ecd9739be8','1be76a13-360b-4599-b0d7-cecfe227d31b','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:50',NULL,'Sakal Polyclinic Street 2004',NULL,'IPD1-PC2'),
('8e1fa58d-999d-4e66-8a74-a4f4c5732b06','7704aaec-9131-40df-ad65-3852404a056f','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:23:22','KHEMA Polyclinic','KHEMA  Polyclinic','Server Room','Server Room'),
('8e309a45-6f49-464b-801b-3def40fc96b3','03afe9fd-3914-46bb-99ff-ebdefe75118b','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:51',NULL,'Sakal Polyclinic Street 2004',NULL,'ICU'),
('8e5a57f3-58f1-4f15-976c-fc99d5115e47','330728e5-92cb-4cc0-b6c3-daa9d3318dae','Transferred Asset','Braseth Official','',NULL,'Active',NULL,'','2026-05-07 09:10:51','KHEMA Hospital Toul Kork','Sakal Polyclinic Street 2004','IT-Office','IT office (IT Locker)'),
('8ea92547-112b-4c31-a1da-3ef17d62bc9e','7d4ecd42-dba9-424f-9e36-cccd0992189f','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'Nurse station 3F'),
('8eadbfa5-0bde-4ad9-a27d-defdc922d54e','03873dcd-9320-4923-8f95-24b7d26cb4e6','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('8f81ff81-022b-49fe-9577-c1ac860d73a2','5010d1bd-8e1b-4737-8e02-b5910694a798','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:40','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','EHS Manager KG','EHS Manager KG'),
('8f920b44-bd05-49da-8915-356a2d627722','ff4e3512-2999-477a-b0f2-8c9aeb941c5a','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','BLOOD SAMPLING - TREATMENT GF','BLOOD SAMPLING - TREATMENT GF'),
('90598e7a-ce75-4bf8-94a3-1cd42a1b2df5','9173ce52-ecc2-4a0e-badf-51e4c526dfa4','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:15','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station L','Nurse Station L'),
('907026fb-f5c4-471d-8d8b-d61a74d41d54','7df7e0e4-f34d-4e52-a06a-5af3263d1118','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:19','KHEMA Polyclinic','KHEMA Polyclinic','IT stock','IT stock'),
('9077e6de-64c0-46f5-9a17-ef952d4cadce','e02d9301-7737-493d-9181-c1f528dd4805','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:15',NULL,'KHEMA Polyclinic',NULL,'GM'),
('90b4773b-02fd-43ef-9b3d-1d3366a57cf9','b1a52772-b431-41c5-b60e-a7bb6c67b988','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:07','KHEMA Polyclinic','KHEMA Polyclinic','Customer Service','Customer Service'),
('90b4ffe2-f3da-4bbe-a993-676f409c2c89','93d472d8-f4da-49f2-9f5c-ddba264aa9e0','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA  Polyclinic','KHEMA Polyclinic','Cancer Center','Cancer Center'),
('91ae50db-a3ef-4b97-9fab-e273ac48cab2','0b83acc3-3f39-4d57-b920-d05d9974f14f','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA  Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('92cd2e75-94b0-430f-8609-96aa474700de','9228a5a9-e38c-4426-adf0-d1cb761a60e9','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('930350ab-ea86-4f84-9c74-bd0a0fdf1a18','312abde0-a6c3-43b4-8d9c-eb73903487ec','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:12','KHEMA Polyclinic','KHEMA Polyclinic','Customer Service','Customer Service'),
('93b274c2-6d56-45f0-a6a2-217a19997d85','369b2695-e586-4bb0-9f19-5ac43aaef00e','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:03',NULL,'KHEMA TK',NULL,'Transfer to K3'),
('93da122f-923a-42ab-afb0-f87e255ba54f','8a6c6f75-8332-4d26-b59c-fe2ed2cdaf73','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:25:33','KHEMA Polyclinic','KHEMA  Polyclinic','Display','Display'),
('947b3c4d-d526-45fa-8502-c05011af97d1','965cc9fc-fff8-4be8-a9c9-3e7223dfe4a3','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:21','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('94df2694-099b-4f0e-8880-8905e1baab65','73365d71-a258-4050-a8b9-2a226c7731ec','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','Keeping in locker ','Keeping in locker '),
('94f61e81-d7e3-47ab-878f-16d8c80eafb1','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('95a13ad1-feff-4bb8-9fd1-d24c6f05053a','e0725333-0907-47a7-8306-82fcb43fb72d','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','Medical Stock','Medical Stock'),
('960f7add-91ce-4dd1-b192-49db09f94893','7704aaec-9131-40df-ad65-3852404a056f','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:20','KHEMA  Polyclinic','KHEMA Polyclinic','Server Room','Server Room'),
('978c840d-3ad0-461d-a4af-b000a31a5960','05ec786f-230b-404a-8fdb-cdce535d0d6b','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:13','KHEMA Polyclinic','KHEMA Polyclinic','Pharmacy left','Pharmacy left'),
('9872d7d1-815f-488b-93a9-a4ec90246e2f','4ca32c40-d49f-4b48-842d-01b5b4291463','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'K1FGRICU'),
('9889a290-1114-433e-84a0-e339d5f3734b','23ebd2df-1227-4fbb-a5e6-5fc0fe24a139','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:03',NULL,'KHEMA TK',NULL,'K1P3 Server room'),
('9947b5ab-2711-4c1d-b9ae-81a4548e59ad','03afe9fd-3914-46bb-99ff-ebdefe75118b','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:35','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','ICU','ICU'),
('9967dd01-bfd9-43f4-8d32-e2865b508750','082df062-5076-4f8e-b266-0e4491f39706','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:43',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'HR Officer'),
('9969bea9-bd5e-450d-a78f-4e0b5b66eb9b','98ca011c-4e15-489e-b643-e99b284f05cf','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:27:12','KHEMA Polyclinic','KHEMA  Polyclinic','Nurse Station','Nurse Station'),
('99b39ec6-502e-484c-97fd-de30986bb2b1','3e893cdd-2bae-41e4-acbc-bce1b55c8478','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:17','KHEMA  Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('99d41658-c776-4da2-ac3c-366e10ce6524','81b0ab93-a745-4697-8cf5-dabddeb6d857','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'ER Customer Service'),
('99e6dda4-8bbf-4c2e-8ebe-42ebde24ecfb','a6cc3700-6221-4634-bc68-eaad84ca5619','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','Nurse Station 1F','Nurse Station 1F'),
('9a68417f-ef77-471c-911a-8981c7c45066','3afbda1d-227f-41b8-a50c-98869e4adc45','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:47','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Servcer Room','K1P4 Servcer Room'),
('9aeb21d4-d6d6-4bda-b368-474844151677','b0af22aa-2025-413b-8527-c143efacfd38','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','ECHO ROOM ','ECHO ROOM '),
('9b3d2c95-85c1-4cda-b61f-6fb67e6f9a04','3a37e11f-ffe8-4be0-988e-882903aa910c','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','OPD NURSE STATION PC1','OPD NURSE STATION PC1'),
('9b5ab0b6-e372-447b-aaac-6897ff1e2eef','4c545a11-7742-475f-916f-0dea7e3f364b','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:17',NULL,'KHEMA Polyclinic',NULL,'Display'),
('9b7aa4b9-7e9b-4c7e-84c5-228f320d15cb','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 06:23:31','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('9bb3518b-9b7a-4188-a511-fce864759daf','efdf9b57-9ff4-4243-a32d-54b9702e8d52','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'K1P3 Meeting Room'),
('9c3bba36-2b40-4220-a099-a7da1dc0e487','9173ce52-ecc2-4a0e-badf-51e4c526dfa4','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:12','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station L','Nurse Station L'),
('9cd95f1f-b2ef-4a10-8f42-52440a1dd7c3','1e02fca7-50b3-41b4-b1e4-d4cbc7d2e71c','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'IT room'),
('9d0a7345-9374-44ee-97a0-d3335131f94f','99a58774-5fdf-4573-afca-b72ae10744b4','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Pharmacy center','Pharmacy center'),
('9d148870-0797-4af1-863a-0c36478c32e1','4cf10155-e5f8-4ae1-b9a5-b1b95d61e5fc','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:07','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('9d684522-3ed9-4e15-80a3-9f66ab48a1af','3cb5e7be-78c9-4a2a-9740-f6b110a63d56','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:36','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Chief account SAKAL','Chief account SAKAL'),
('9db780c9-f2b5-44bf-893c-3d72d4aa7885','24de18aa-1619-4e9f-bc49-43a2d83cbd34','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'K1FGRICU'),
('9dfb76e7-c9e7-4625-996d-1a45a59b35e3','6d276d74-f851-4a99-bdf6-75b200eb9cf1','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('9e6eb71a-a9cc-4397-9e0f-ec5eeb5da7e4','cd48891f-611d-4bf1-af6b-e52f7b18bcf9','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','Cath Lab','Cath Lab'),
('9f0b6068-04c7-4c25-ae11-40f4e8615fe7','5f2064c6-9c37-4500-85f3-5e6f59a08c88','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('9f164c88-0979-455e-97f4-d90479b488a1','cf503a35-8631-42f3-825e-6d742aef7757','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:35','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','K3F2-Nurse','K3F2-Nurse'),
('9faa08c8-98c6-42c3-8e74-4886d6a6d5d5','2de85bc6-c770-4453-93fd-668f445e3068','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','K1','K1'),
('a06fcadd-af6f-45fc-bc0b-2cd4f64eec29','9a94f268-7ca8-44cb-8493-3cf952194a27','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:13','KHEMA Polyclinic','KHEMA Polyclinic','Billing front left','Billing front left'),
('a0755e8e-1fcd-4f3e-8031-dc9fd46aff5f','459824e8-34d6-4243-aee0-d4179d68725b','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'K1P3 Administrator Office'),
('a0c22add-c98e-4ebf-b28a-aa8413b0749a','b264049f-419f-44a2-8954-bcbf2926779c','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'FIN'),
('a111f0ec-1c90-4624-94a2-790c8718671d','93d472d8-f4da-49f2-9f5c-ddba264aa9e0','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','Cancer Center','Cancer Center'),
('a1b5a5f5-e69d-4ea6-978a-6b523bdaa822','6c331b42-c7db-40f9-98c2-785af6c1e0ea','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'GI Endoscopy Room'),
('a27c3d7d-71a1-4a0d-a2c5-4fac190f791f','c7fd3e60-896a-429e-a8c4-678acb74db7e','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:13','KHEMA Polyclinic','KHEMA Polyclinic','Billing front right','Billing front right'),
('a2a671c9-4f6b-4dd6-b157-3145e78fdbf6','7165d2e5-478e-45c0-8165-965892885545','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','1Floor patient lounge K1P4','1Floor patient lounge K1P4'),
('a2a91610-88d4-484a-999c-80de943ff852','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 06:23:31','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('a3f2b7f4-a7be-482a-96e3-9629cd5afa1c','e9e43b92-4e46-4d0e-87bd-b072d8df4e4e','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Servcer Room','K1P4 Servcer Room'),
('a40eae4f-210f-4611-9dca-b988b3b23b81','d3e37e15-eda4-41d5-a6d5-b4213b378133','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','OPD NURSE STATION PC2','OPD NURSE STATION PC2'),
('a40f1059-1f50-496b-94c4-b71420f70cf9','4a7cce36-2044-449d-8c8e-3ead5211bd60','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:08','KHEMA Polyclinic','KHEMA Polyclinic','Stock Controller','Stock Controller'),
('a415ce08-75fd-4af6-853a-c2e50c28ea8d','1e02fca7-50b3-41b4-b1e4-d4cbc7d2e71c','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','IT room','IT room'),
('a43ce592-b7f5-40fc-b143-a35cde45138e','8f884818-d1c0-4957-a569-f7d199350a88','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:14','KHEMA Polyclinic','KHEMA Polyclinic','X-Ray L','X-Ray L'),
('a449367b-b01e-4e3b-b596-aa8f11f741e9','e9596f76-42f5-459c-8379-274eb0c76e78','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','K2F1-Pharmacy1','K2F1-Pharmacy1'),
('a469d1b9-d062-46e4-9d18-18d8b18cc4b2','29ae9c4f-89dd-40e2-9afb-7b6309f09ce4','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:18','KHEMA Polyclinic','KHEMA Polyclinic','Appointment Center','Appointment Center'),
('a48a8030-f07e-41b3-8b6d-c1f60f6df5c0','8e3ad428-8fbe-4155-9bc0-24ec65f2caa9','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:49',NULL,'Sakal Polyclinic Street 2004',NULL,'LAB AIO PC'),
('a58e2c6e-a5e3-475c-aedd-212e83d0c9ac','ad34f90d-e6bf-456b-beb6-0d8c1abc7340','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:38','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Admin Office','Admin Office'),
('a649c620-cae8-4f77-b492-99557dd5988d','5010d1bd-8e1b-4737-8e02-b5910694a798','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'EHS Manager KG'),
('a7b1e2cc-b3ca-40e6-9936-3771a0c6e03b','36e49592-22e0-453c-a7ac-218f5494b4b1','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:41','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','Accounting (Nam Sreyroth)','Accounting (Nam Sreyroth)'),
('a85fb95e-2c60-494a-a42a-8be50aac667b','aa196813-512f-4a51-93a3-99d40d8ef354','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('a89d0c4f-54e8-4b2b-b2fb-d58623078758','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:17:16','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('a8df6cb0-a185-44b0-8418-6c12029b8d64','cd48891f-611d-4bf1-af6b-e52f7b18bcf9','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:16',NULL,'KHEMA Polyclinic',NULL,'Cath Lab'),
('a8e6f2c8-aa7a-47f5-b60e-7a2c0f36a336','88193731-d103-4fdb-b1b2-6ee42be50418','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:12',NULL,'KHEMA Polyclinic',NULL,'Billing back right'),
('a9f03f25-ea2f-4d55-9565-d195c2bd4055','175745e2-d564-4bd3-ae4f-2b65f4336bc8','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:17',NULL,'KHEMA Polyclinic',NULL,'IT'),
('aa15d137-603d-40cb-8fc0-af7ede480c9e','97fa80aa-37ed-4e12-8a18-f02ef4f2f4c7','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 CT Scan Room','K1P3 CT Scan Room'),
('aac265df-a373-49c1-a902-0ad8d25c3da4','67b5b803-b1dc-48c4-865d-4b8540ab9935','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','Doctor lounge','Doctor lounge'),
('ab923ff5-60ff-4ea3-9085-f0b9f4ee351a','45e5a95e-b55b-426c-a307-03c5487fb305','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('abc8b135-b4b5-4a60-8169-389fc0b3f419','a2e38f14-8914-4705-a547-43fb02439793','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:14','KHEMA Polyclinic','KHEMA Polyclinic','Laboratory R server','Laboratory R server'),
('ac24728c-48f2-4db7-a365-3de80fa6fb12','750cf041-a6ca-4348-95ae-9ebccd3eaa5e','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'K1P3 Customer Service'),
('acc8d1da-c59a-4e1b-9341-fa6aa45535be','4c008e83-6c85-498f-8c68-5d781851f70f','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:51',NULL,'Sakal Polyclinic Street 2004',NULL,'IT Support Laptop'),
('acf9bd38-a34b-4729-8d14-efce2c6491a3','99a58774-5fdf-4573-afca-b72ae10744b4','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:12',NULL,'KHEMA Polyclinic',NULL,'Pharmacy center'),
('ad2c41de-9a48-4766-94da-35eb5508c10d','06dc6d9f-8621-4fe2-a126-5d289f166918','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'KG-CFO'),
('ad91602d-0204-4f8c-9c5f-1262ad4dfccb','f1e7eb4a-4388-42d5-9249-30d69769e19a','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','Doctor Lounge L','Doctor Lounge L'),
('adb4f0f2-630a-4874-8082-37065444f7a7','f5b25a0b-833d-446c-921b-856c24addcb6','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:36','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Home Care K3','Home Care K3'),
('adb863a8-f000-49dd-8bd9-8731c041c319','93d472d8-f4da-49f2-9f5c-ddba264aa9e0','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:20','KHEMA Polyclinic','KHEMA Polyclinic','Cancer Center','Cancer Center'),
('ae0d44fa-13fe-4f63-8c15-a8a8a0f484aa','c78d5069-db6f-4079-a137-7cfa4260201a','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:01',NULL,'KHEMA TK',NULL,'Nurse station 1F'),
('ae74c46a-0872-4b7c-b249-6bc99507a2d1','b8af354e-7aef-4ef5-a770-8534ab8ef467','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:40','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','Server Room','Server Room'),
('aee9c159-fd86-4df7-88a3-9c6309b93da8','f78418ac-e353-404f-b8c2-f492a13afe7c','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:17',NULL,'KHEMA Polyclinic',NULL,'Server'),
('af5f28dd-ab99-45f0-b6a9-fd75aadab553','a6de1fb6-d128-4015-92de-0a22a8fcdd89','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:08','KHEMA Polyclinic','KHEMA Polyclinic','London Room','London Room'),
('af8a0607-51de-452a-9a21-910e7ccef012','64604375-50dd-403f-8701-1e662ec17541','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','Cashier GF','Cashier GF'),
('afad172f-3136-450c-92de-b2466352bef5','2203f534-dbd3-4406-b1f2-a9dcc9c47996','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:28:32','KHEMA Polyclinic','KHEMA  Polyclinic','Dr.Khimuy','Dr.Khimuy'),
('affd68e7-1fee-4773-8711-f28791c6526b','773e6af6-61c9-48b8-a679-49047289e5a1','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:03',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('b0936f0e-bc67-4dd6-bce5-1045cbd05b2d','05ec786f-230b-404a-8fdb-cdce535d0d6b','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','Pharmacy left','Pharmacy left'),
('b0dda5f1-c032-4e98-a18e-b5311c31d6a5','da067572-0f95-40e5-9f8d-4009e76758ee','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'Nurse station 3F'),
('b1704235-83a1-4e1c-ad9e-3dc471d868ea','c7fd3e60-896a-429e-a8c4-678acb74db7e','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:12',NULL,'KHEMA Polyclinic',NULL,'Billing front right'),
('b1db73d0-702f-43b4-b538-46ba9bba8d7d','8cf70bed-d285-45ef-81ce-d728fcec476a','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','ER Nurse Station','ER Nurse Station'),
('b1f0eb75-0937-4739-aa5e-feac20d1ee2f','082df062-5076-4f8e-b266-0e4491f39706','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:42','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','HR Officer','HR Officer'),
('b289b4a2-0291-48c0-a651-b591edb70e12','4c545a11-7742-475f-916f-0dea7e3f364b','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','Display','Display'),
('b2f3fa9f-f1ef-4fc7-9861-9c05ee4a325d','fbb8425f-4357-490b-9b28-e4a0b6bcd600','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:16','KHEMA Polyclinic','KHEMA Polyclinic','Stock Controller','Stock Controller'),
('b339dfd3-4d6d-4266-a95c-adc0def74fbc','9a94f268-7ca8-44cb-8493-3cf952194a27','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','Billing front left','Billing front left'),
('b3487adc-7224-42b6-9484-a240a163a807','f27a740a-f210-415c-b3d7-bf56d9e5fff3','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','Ground Floor Patient Lounge K1P4','Ground Floor Patient Lounge K1P4'),
('b382662f-aebb-4a5c-9bc9-9eac51ce7aa7','318cb519-5a94-4566-b8e1-05e35eb834e7','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:14',NULL,'KHEMA Polyclinic',NULL,'Echocardiography'),
('b4055c64-4ef0-4cd4-acd8-d510ee5346a1','4ec147a4-56a1-4b5a-a443-fdf478d3cbcb','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','K1F2RICU','K1F2RICU'),
('b4259ea3-d97f-4b19-8ff8-586a64b3d70c','4cb512f9-b48f-498a-916c-8bc30e6fb8e2','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('b440fb9d-cb53-4d1f-8957-53889a21d05f','626de88f-d7ba-4404-827b-d5566f4ff713','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:53',NULL,'Sakal Polyclinic Street 2004',NULL,'NURSE COUNTER Floor 3'),
('b45de36e-bcb3-4bf8-afad-d9a0bd3aca5a','f385919c-b4a7-46df-aa1f-a1e15412df46','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'K1F2RICU'),
('b501b8b2-5ee8-442e-872c-db6df33399a4','d0652a9f-2b5f-4590-b4fb-b39c283b4bab','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:15','KHEMA Polyclinic','KHEMA Polyclinic','Pediatrics','Pediatrics'),
('b593f656-b745-4d5c-b0cd-87c4396be33d','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:15:39','KHEMA BKK','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('b5edaf20-4f0c-4af4-baa7-df6f064edbe4','9ed32333-b882-4be4-8ae6-a8158b7f33b6','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:16','KHEMA Polyclinic','KHEMA Polyclinic','PhnomPenh','PhnomPenh'),
('b672b569-a38b-4f5e-b855-0d89f6e5687a','d0652a9f-2b5f-4590-b4fb-b39c283b4bab','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','Pediatrics','Pediatrics'),
('b6eabb0e-b0fc-4d5e-9eab-5d7d741c281a','87581c15-dd83-4047-88d5-e161de4ceadd','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:50',NULL,'Sakal Polyclinic Street 2004',NULL,'Billing PC'),
('b74cb31f-451a-44f5-a1f9-b29602c03483','8f884818-d1c0-4957-a569-f7d199350a88','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:07','KHEMA Polyclinic','KHEMA Polyclinic','X-Ray L','X-Ray L'),
('b7a952c5-921e-4e49-9c7a-14c27a13396b','2203f534-dbd3-4406-b1f2-a9dcc9c47996','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:08','KHEMA Polyclinic','KHEMA Polyclinic','Dr.Khimuy','Dr.Khimuy'),
('b84d0462-1095-494d-b687-7f38b07347e1','b1a52772-b431-41c5-b60e-a7bb6c67b988','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'Customer Service'),
('b8874b62-6971-4de1-9ff4-1a1ed8458d6f','d05a2232-36b5-4482-bbce-07b5c2df62cc','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','EEG & EKG Room GF','EEG & EKG Room GF'),
('b89ac22f-e4f9-497e-8c9d-cc1f9a852fbb','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 06:19:15','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('b8b368a8-3cc2-461c-bcde-e769ce6be282','aa6fe63b-e119-4a3c-9f0b-6dabeef3b815','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Doctor Lounge R','Doctor Lounge R'),
('b8e1a882-6084-4469-a8b3-3c1e8c2b3b19','4560cead-74b2-4e17-bab8-3152f40616dd','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'K1FGRICU'),
('b9196bef-f63c-4040-969e-dbfeaa359b03','a4b20d55-6b48-4229-8283-8d0211db86d8','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'Administration Office'),
('b9f2bf85-f3fe-483d-9b11-e30a9ab55df6','dfbb8949-aad8-411f-a94b-a3249fea67a4','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:50',NULL,'Sakal Polyclinic Street 2004',NULL,'Okide Room'),
('b9fd1b6b-a589-4b05-ba49-870f20a404a4','6d139f8f-1e0f-411d-a3ef-a6c95ebf1937','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'K1 Laboratory Room'),
('ba3ceeda-95c8-44ad-8215-f66f66b38cb3','2a1abafb-34c4-4f15-af52-dcbc1843ac40','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:29:44','KHEMA Polyclinic','KHEMA  Polyclinic','Relationship','Relationship'),
('baf8f98b-8bc3-4308-93b1-6af78296d3cf','05ec786f-230b-404a-8fdb-cdce535d0d6b','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:12',NULL,'KHEMA Polyclinic',NULL,'Pharmacy left'),
('bba38c81-ccc9-4d85-a670-087ed50a6258','7632441f-3c32-4941-a652-1c55869ad386','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:53',NULL,'Sakal Polyclinic Street 2004',NULL,'PHARMACY ROOM'),
('bc7b5a3f-9b7e-4477-a278-180069db503c','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:17:09','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('bc8bc986-4da3-44c3-bcc4-ac4ea54bc7df','f67a88df-1280-42d5-bc71-47a1864bc982','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:12',NULL,'KHEMA Polyclinic',NULL,'CT-Scan'),
('bd0d0998-0a0f-4506-bd3e-0ccfeffb2995','433fdefa-1827-44ab-afcb-e419c53b20c8','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'K1P3 Consultation Room'),
('bd0ed5e1-f16b-45b3-a8b7-84b377cafe0a','1be76a13-360b-4599-b0d7-cecfe227d31b','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 09:18:36','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Relationship-Officer','Sakal AP'),
('bd8871d0-ffc3-4213-81a2-1772508f10d7','a85e554b-5a2b-49d1-b3c1-f1e5c9e1634f','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:16',NULL,'KHEMA Polyclinic',NULL,'Desneyland'),
('bdad9e26-fdf1-459f-addb-e1fc0b8fe993','338fed14-8181-4ec9-9e4f-2fe4c12da90d','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','ER-NursePC2','ER-NursePC2'),
('bdad9fbb-776b-4937-b621-3d84a6a1c336','9853080f-5620-412f-a68e-cf6f9e2d91ee','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','Nurse station 1F','Nurse station 1F'),
('bdc536b3-17db-4007-9323-824ffe6d147b','e5df5517-449c-4f0c-baf8-d6ab602a041d','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:43',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'K1P3 Nurse Station'),
('be372deb-971d-439a-99b8-38df142982e2','887884b7-f5d9-4cec-899f-1a9e93fb5520','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:16','KHEMA  Polyclinic','KHEMA Polyclinic','Housekeeper','Housekeeper'),
('bf082ace-04a2-46ec-8246-ef58a31520c3','9ed32333-b882-4be4-8ae6-a8158b7f33b6','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:14',NULL,'KHEMA Polyclinic',NULL,'PhnomPenh'),
('bf6740b9-3ee1-420a-80fd-8ff43d80b647','7862b2ba-db1e-412a-883a-a375fdb00c70','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','K3 Server Room','K3 Server Room'),
('bf6f83de-6352-48b8-abc1-441e8e6f5f99','312abde0-a6c3-43b4-8d9c-eb73903487ec','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:05','KHEMA Polyclinic','KHEMA Polyclinic','Customer Service','Customer Service'),
('c00e876c-b36c-46b4-a183-88f3d2529055','473f9e4e-1b5d-4270-93a6-e5577d00a995','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:27:18','KHEMA Polyclinic','KHEMA  Polyclinic','Admin Officer','Admin Officer'),
('c034b851-4f52-4596-ab75-a86a506f4476','0b83acc3-3f39-4d57-b920-d05d9974f14f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:09','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('c149486d-67f1-471e-95ff-ee75703971c6','99a58774-5fdf-4573-afca-b72ae10744b4','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:13','KHEMA Polyclinic','KHEMA Polyclinic','Pharmacy center','Pharmacy center'),
('c20e7352-3221-4fe9-a763-fd5e69b3e409','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:03:26',NULL,'KHEMA BKK',NULL,'Marketing Room'),
('c2382611-0940-402b-9fae-863ddbcd2047','751e92a7-5820-424b-85f1-450e2c7202a9','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:19','KHEMA Polyclinic','KHEMA Polyclinic','Server','Server'),
('c2398e35-9647-4f8d-ae93-5fc5948e77e0','3666824f-1b9b-43d4-ad21-45f3724197d0','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('c2854f1b-d982-4d23-82be-f8fbb6d1944c','5867fdce-06e8-4f8e-b82a-23c625a6eae3','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:51',NULL,'Sakal Polyclinic Street 2004',NULL,'IT Support Desktop'),
('c2ed6d0d-dc35-4542-917a-f5450b68a31f','29ae9c4f-89dd-40e2-9afb-7b6309f09ce4','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:16','KHEMA  Polyclinic','KHEMA Polyclinic','Appointment Center','Appointment Center'),
('c302787d-627d-4c24-b7ba-ab725df841c0','4cb512f9-b48f-498a-916c-8bc30e6fb8e2','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:17',NULL,'KHEMA Polyclinic',NULL,'IT'),
('c3977f15-1b27-4ee1-943a-6be568cd750c','24de18aa-1619-4e9f-bc49-43a2d83cbd34','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','K1FGRICU','K1FGRICU'),
('c4c7b600-2569-4175-a7f2-2bc680e40534','96e7b983-4152-4f7b-85ee-a646b550860e','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'Pharmacy Room'),
('c53e26c5-90b1-4e52-b13a-89758da795cd','dfbb8949-aad8-411f-a94b-a3249fea67a4','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Okide Room','Okide Room'),
('c59f7e8c-83c4-4fd0-b395-76e1c1544aa6','491d5d18-7308-4c90-a2b1-bf0eba31df11','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:07','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('c5f6b48d-e7bd-49eb-9d0c-e4a0a42c993f','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:17:52','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('c774efd3-0c72-47a6-8050-6063728a0329','500fcc8a-f867-4da7-9286-ea4a468906da','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:25:23','KHEMA Polyclinic','KHEMA  Polyclinic','Display','Display'),
('c80ebf88-1fe9-43c5-bf38-0f7790de3416','a6de1fb6-d128-4015-92de-0a22a8fcdd89','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:18','KHEMA Polyclinic','KHEMA Polyclinic','London Room','London Room'),
('c8659604-be4d-426b-ae7a-4bbf5abfc6e4','491d5d18-7308-4c90-a2b1-bf0eba31df11','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:15','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Gynecologist Room'),
('c8ddc0ed-8183-402f-9999-26d9911dbef1','3b721875-c689-4b04-a332-8b93cb3a32a5','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','CT-Scan R','CT-Scan R'),
('c96fbaa6-8c1b-423b-9dc8-aa55ba3f5c5e','6d139f8f-1e0f-411d-a3ef-a6c95ebf1937','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','K1 Laboratory Room','K1 Laboratory Room'),
('ca3fa6c5-7db3-4917-906d-513ccca500ff','f385919c-b4a7-46df-aa1f-a1e15412df46','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','K1F2RICU','K1F2RICU'),
('cab6a358-79ee-4fa1-acaf-d05c50684c52','93d472d8-f4da-49f2-9f5c-ddba264aa9e0','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:25:27','KHEMA Polyclinic','KHEMA  Polyclinic','Cancer Center','Cancer Center'),
('cac7d9d5-03fb-419c-bff3-0c1132fffefa','3e893cdd-2bae-41e4-acbc-bce1b55c8478','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:15',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('cb41210f-e213-4e30-8556-132b6375e861','7165d2e5-478e-45c0-8165-965892885545','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:03',NULL,'KHEMA TK',NULL,'1Floor patient lounge K1P4'),
('cb9c455d-908a-4286-93f6-b13852ab4ca3','03873dcd-9320-4923-8f95-24b7d26cb4e6','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:29:53','KHEMA Polyclinic','KHEMA  Polyclinic','Nurse Station','Nurse Station'),
('cb9c6841-64b7-4d96-8413-ee388bf85e14','5094234e-4c6c-4a2d-a2a9-b3d3e699fd2a','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'Spacialist & Consultation GF'),
('cb9ebbed-3756-4600-9ede-6ca13173b9af','73238c59-55b0-4fcf-8a6f-088a624acc44','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:20','KHEMA  Polyclinic','KHEMA Polyclinic','IT room','IT room'),
('cc10966b-7509-463c-b4f2-8cfb780a2d04','e02d9301-7737-493d-9181-c1f528dd4805','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:28:41','KHEMA Polyclinic','KHEMA  Polyclinic','GM','GM'),
('cc134e73-f330-4af6-b30c-d7887528b1cb','6f81df53-a429-483e-84c7-dfa1d9c06ad7','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:03:26',NULL,'KHEMA BKK',NULL,'IT'),
('cd308dda-5921-4aa1-8a51-4d15c8950aec','f040a9b5-58ea-4216-87cf-8c3650a6c7a8','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Dr.Sopheap Room','Dr.Sopheap Room'),
('ce36637a-4e26-411d-97ca-68a6dc70baa9','ff4e3512-2999-477a-b0f2-8c9aeb941c5a','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'BLOOD SAMPLING - TREATMENT GF'),
('ce5b07cd-3f52-4fbf-aaf8-1d5b39446c94','4a7cce36-2044-449d-8c8e-3ead5211bd60','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:28:19','KHEMA Polyclinic','KHEMA  Polyclinic','Stock Controller','Stock Controller'),
('ce6a30c8-21d9-4130-a62e-bf053dac431a','473f9e4e-1b5d-4270-93a6-e5577d00a995','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA  Polyclinic','KHEMA Polyclinic','Admin Officer','Admin Officer'),
('ce775a79-e097-4ac5-a1b1-f40dea6fee48','8cf70bed-d285-45ef-81ce-d728fcec476a','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'ER Nurse Station'),
('cee1d867-c415-406f-a622-fdfb686e7a5f','b0af22aa-2025-413b-8527-c143efacfd38','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:52',NULL,'Sakal Polyclinic Street 2004',NULL,'ECHO ROOM '),
('cf6b6c9c-ef91-460d-b15d-01158507f2c6','88193731-d103-4fdb-b1b2-6ee42be50418','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','Billing back right','Billing back right'),
('d0ba1eba-c9fb-4335-804a-70fa48b100fb','12131758-0acf-4b9b-bdd1-9b73f7d7d88f','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:20','KHEMA  Polyclinic','KHEMA Polyclinic','Meeting Room','Meeting Room'),
('d1182450-5775-403c-a630-46614360d66d','965cc9fc-fff8-4be8-a9c9-3e7223dfe4a3','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:19','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('d162a713-0d93-416e-a259-265c01d2a061','4c008e83-6c85-498f-8c68-5d781851f70f','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:35','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','IT Support Laptop','IT Support Laptop'),
('d1ceb0e0-f2f0-4317-8200-ba710588051a','ee5b3ea1-9d60-4e2b-a311-dbd9df898743','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('d25cbe93-01a5-49da-87cc-824df867c87b','9173ce52-ecc2-4a0e-badf-51e4c526dfa4','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:05','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station L','Nurse Station L'),
('d2de62a3-dab4-4063-a80a-77a8304ed701','a6cc3700-6221-4634-bc68-eaad84ca5619','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'Nurse Station 1F'),
('d2fcbc06-a1f8-4e18-a198-84665a66be31','e996203f-f85e-4cd6-acdf-effe05a12f40','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:18','KHEMA Polyclinic','KHEMA Polyclinic','Singapore','Singapore'),
('d31f9875-dbbe-4bcb-a414-a3cb7614f6de','aa7470a9-dec6-4377-9c55-336f6eb08d70','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:40','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','ADM','ADM'),
('d3d65466-b88b-4048-80ce-f22367efc3fc','f8920fa9-c417-4194-8156-68def9f9adba','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('d42559b3-ee04-47b6-82ea-23f342f1a47b','ba13f1e5-d77a-445d-a581-19cda575f4dd','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:01',NULL,'KHEMA TK',NULL,'Cashier GF'),
('d479f739-3b07-4ce4-b355-c99464329f97','fbb8425f-4357-490b-9b28-e4a0b6bcd600','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:18','KHEMA Polyclinic','KHEMA Polyclinic','Stock Controller','Stock Controller'),
('d512aeda-5b89-4eb9-8e9b-d0f7f9f1f8f2','15af75e1-51e0-46c6-8a21-90856186f5b7','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:49',NULL,'Sakal Polyclinic Street 2004',NULL,'BILLINGGF'),
('d545ab42-2d79-42c0-ab12-71b625887205','98035706-ecac-44aa-8223-90faacac06a4','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:59',NULL,'KHEMA TK',NULL,'K1FGRICU'),
('d57a528d-9078-452a-adca-b38037b05eba','b3b4ae2d-fcd9-448c-8bc6-424d569cc2c5','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:55','KHEMA TK','KHEMA Hospital Toul Kork','Ground Floor Patient Lounge K1P4','Ground Floor Patient Lounge K1P4'),
('d5f58e6f-46e9-4f12-82f2-cb61a711d9b5','55e85173-0630-460d-8a07-0a1a069f40d6','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:49',NULL,'Sakal Polyclinic Street 2004',NULL,'LAB System uniqe '),
('d61b3629-1bbb-457c-a344-bdc5cb85f7ee','12131758-0acf-4b9b-bdd1-9b73f7d7d88f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:22','KHEMA Polyclinic','KHEMA Polyclinic','Meeting Room','Meeting Room'),
('d620181b-0981-42f7-9699-1656a74da5b2','ee6dda5c-fb2b-45bd-b816-dcd43ce3fa8f','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:30:03','KHEMA Polyclinic','KHEMA  Polyclinic','Marketing Room','Marketing Room'),
('d6cbabb5-fdb8-4f2d-bb86-1441bf4ba775','c337f5a7-0417-4421-8410-abc052a471d5','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:42',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'Accounting (Kunnaroth)'),
('d758a28c-cedb-4baa-99a2-f26af5a64723','55e85173-0630-460d-8a07-0a1a069f40d6','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','LAB System uniqe ','LAB System uniqe '),
('d78665fb-3500-4511-9b0c-3baf0750f4ba','f1e7eb4a-4388-42d5-9249-30d69769e19a','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:12',NULL,'KHEMA Polyclinic',NULL,'Doctor Lounge L'),
('d7aea2c8-6ee7-4dc2-8f78-99a38fc04043','505ff021-5a49-43b7-9c81-83a540d755b8','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:11',NULL,'KHEMA Polyclinic',NULL,'Nurse Station R'),
('d7afe68d-f6c4-476b-9030-422de409053e','9d6c4778-d909-46d7-ac0d-3d3fe99e41dc','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:56',NULL,'KHEMA TK',NULL,'K12FRHemo'),
('d851c274-dc13-4fcc-9f7e-f0a8d8e6f277','505ff021-5a49-43b7-9c81-83a540d755b8','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:15','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station R','Nurse Station R'),
('d87b01ba-5fc9-4c6a-80ad-7f8c36c10052','df07e4cb-d647-42ad-a0d5-87ae7bc2adab','Transferred Asset','Braseth Official','',NULL,'Active',NULL,'','2026-05-07 09:10:51','KHEMA GLOBAL CO.,LTD','Sakal Polyclinic Street 2004','Sakal Relationship Manager','Junior IT Laptop'),
('d9650e5b-6d06-46fc-b6f4-5b8115e9fe32','ee6dda5c-fb2b-45bd-b816-dcd43ce3fa8f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('d9740332-caef-4d3b-b22c-6882a679392f','8a6c6f75-8332-4d26-b59c-fe2ed2cdaf73','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:19','KHEMA  Polyclinic','KHEMA Polyclinic','Display','Display'),
('da443b90-1897-4ca7-97b8-09ef1a98253e','f78418ac-e353-404f-b8c2-f492a13afe7c','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:21','KHEMA Polyclinic','KHEMA Polyclinic','Server','Server'),
('da467a61-4004-445a-b34f-4cd213946d84','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA GLOBAL CO.,LTD','KHEMA Polyclinic','Marketing&Sale Director KG','Marketing Room'),
('dab702e2-6a14-4c6e-8a97-65741bd3d545','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Transferred Asset','Braseth Official','',NULL,'Active',NULL,'','2026-05-07 07:45:42','KHEMA Polyclinic','KHEMA GLOBAL CO.,LTD','Marketing Room','Marketing&Sale Director KG'),
('db268393-1035-4158-923b-76fe4f96aa83','149ad0aa-827f-4595-b28d-274b8d4eb3c5','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:47','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('db2cfa49-8d11-4b83-b617-671b4d9184e5','81b0ab93-a745-4697-8cf5-dabddeb6d857','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','ER Customer Service','ER Customer Service'),
('dccc9728-66e6-4303-8bc4-fb9430ecd7a2','73238c59-55b0-4fcf-8a6f-088a624acc44','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:23:17','KHEMA Polyclinic','KHEMA  Polyclinic','IT room','IT room'),
('dcd90273-530e-480a-9728-c23352e5487d','9ed32333-b882-4be4-8ae6-a8158b7f33b6','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:08','KHEMA Polyclinic','KHEMA Polyclinic','PhnomPenh','PhnomPenh'),
('dd3988ac-d9d7-44a9-aa30-4df3aa178c02','d5052d98-de53-4e17-968f-1c521a3cf779','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:15',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('ddf05ec5-7cb5-436a-90a2-a7976a2a53a5','47937e22-0b7b-4183-b77f-8bca94ae21eb','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:52',NULL,'Sakal Polyclinic Street 2004',NULL,'Home Care K3'),
('de87a0a8-0016-4370-b920-3dd6bca408aa','cd48891f-611d-4bf1-af6b-e52f7b18bcf9','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:27:56','KHEMA Polyclinic','KHEMA  Polyclinic','Cath Lab','Cath Lab'),
('de9d6e86-69fb-44f4-9917-9b32a96edaa4','6d276d74-f851-4a99-bdf6-75b200eb9cf1','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:53','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('df8e1436-887c-4f92-91a1-5516749347c3','e5cb5165-dc33-4ba1-8f51-b725f3d1a9a0','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 07:57:42','KHEMA GLOBAL CO.,LTD','KHEMA GLOBAL CO.,LTD','Insurance & Corporate Partnership Manager-Dany Rou','Insurance & Corporate Partnership Manager-Dany Rou'),
('e00b3d7f-ebf0-4582-8379-01b29af763af','9173ce52-ecc2-4a0e-badf-51e4c526dfa4','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:11',NULL,'KHEMA Polyclinic',NULL,'Nurse Station L'),
('e021ed6f-8d94-497b-9d7e-3b56314cb2e4','887884b7-f5d9-4cec-899f-1a9e93fb5520','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:18','KHEMA Polyclinic','KHEMA Polyclinic','Housekeeper','Housekeeper'),
('e06ff4c2-e8a7-4c3e-8411-35a1322737ba','d05a2232-36b5-4482-bbce-07b5c2df62cc','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'EEG & EKG Room GF'),
('e07396e6-c235-4224-b6c3-0089141e4124','1a3e8dc5-772d-4dfb-953e-a3bfa95f9aa5','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:00',NULL,'KHEMA TK',NULL,'K1P4 Servcer Room'),
('e0a5c52d-4062-4d4f-94b8-e0fc67d3d08e','0410f39f-6854-4db7-9e74-f7786ea9b54a','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:54','KHEMA TK','KHEMA Hospital Toul Kork','Pharmacy Room','Pharmacy Room'),
('e1061230-c332-4300-85bb-a252929ee920','7d203b4b-8a16-4bbd-90e6-8d3e5e4654ae','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:50',NULL,'Sakal Polyclinic Street 2004',NULL,'Dr-Logue'),
('e1a3e2fb-4047-4a56-a631-64848674f7e2','d7ce6c68-fa8c-403c-b9fc-4efa5e1ea909','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:01',NULL,'KHEMA TK',NULL,'General Consultation - Ultrasound GF'),
('e1d4bf30-b4a3-4e71-a99f-7a54051c0b35','b1a52772-b431-41c5-b60e-a7bb6c67b988','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','Customer Service','Customer Service'),
('e2122ffe-3129-4707-8ce3-79179afe6b08','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 06:19:15','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('e2147516-dc34-49e0-8b77-a914a91add09','02cef0de-6c08-46ad-9802-82c7fa1c5f92','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','Server Room','Server Room'),
('e25552e1-d497-444f-8d20-b4cebf81cb1c','d4f9ad09-df3f-474c-bdd8-ff85b87991c8','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:16',NULL,'KHEMA Polyclinic',NULL,'Admin Officer'),
('e2ad10b4-830d-4f85-83a6-85122b7ede51','f040a9b5-58ea-4216-87cf-8c3650a6c7a8','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:50',NULL,'Sakal Polyclinic Street 2004',NULL,'Dr.Sopheap Room'),
('e2f1fd28-ddd0-4cab-be71-0878951c3220','0c188d35-5850-485b-89c5-eaeab616c97a','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'Laboratory L'),
('e327d1ae-5532-4c5f-8c4c-c421c51e28dd','433fdefa-1827-44ab-afcb-e419c53b20c8','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 Consultation Room','K1P3 Consultation Room'),
('e342f8d0-51fe-4ba2-81d5-f7528647d939','cd48891f-611d-4bf1-af6b-e52f7b18bcf9','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:20','KHEMA Polyclinic','KHEMA Polyclinic','Cath Lab','Cath Lab'),
('e3612482-cddb-4fc5-beb0-d29e1618ba0d','9d824634-79ac-433d-a640-ce3ab379e11e','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:01',NULL,'KHEMA TK',NULL,'Registation GF'),
('e37af9dc-7b63-4d6c-9b1b-ef5fe139014b','5163b589-6b7c-4827-b361-7eb289368d57','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'Cashier GF'),
('e38570a8-964d-4262-ad81-32731d5f2dec','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:20','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('e3946497-152a-4387-b0cb-b9635083e350','12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:17:52','KHEMA Polyclinic','KHEMA Polyclinic','Marketing Room','Marketing Room'),
('e4500396-9c7b-42ad-b4af-a59948e67b93','655e6c0d-21fd-4acb-9ce8-2e4aaa474bda','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:50',NULL,'Sakal Polyclinic Street 2004',NULL,'3F-IPD-PC2'),
('e528f546-1eaa-46a7-9694-1c47c1fd82f2','a2e38f14-8914-4705-a547-43fb02439793','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:17','KHEMA Polyclinic','KHEMA Polyclinic','Laboratory R server','Laboratory R server'),
('e561e6e3-cf82-46e8-b84e-8a14d457fcf2','3e893cdd-2bae-41e4-acbc-bce1b55c8478','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:29:39','KHEMA Polyclinic','KHEMA  Polyclinic','Nurse Station','Nurse Station'),
('e5acec2f-621f-41ca-b021-e1b4fd7bee63','09d333fc-38b4-4923-9338-3f447f7a18bd','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'Meeting Room'),
('e6763c1b-3039-4160-9aa1-0a8e45d124e5','330728e5-92cb-4cc0-b6c3-daa9d3318dae','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:36','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','IT office (IT Locker)','IT office (IT Locker)'),
('e6c8329b-6594-4d29-8732-facd892b9b67','4cb512f9-b48f-498a-916c-8bc30e6fb8e2','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:21','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('e7c0764a-a5e9-4eb6-9ad4-411279e90b79','e5cb5165-dc33-4ba1-8f51-b725f3d1a9a0','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 07:45:43',NULL,'KHEMA GLOBAL CO.,LTD',NULL,'Insurance & Corporate Partnership Manager-Dany Rou'),
('e7e0378e-dc5d-4f97-8f2c-21c210ceb783','3b721875-c689-4b04-a332-8b93cb3a32a5','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:07','KHEMA Polyclinic','KHEMA Polyclinic','CT-Scan R','CT-Scan R'),
('e827c5ae-b7ed-4cab-9996-974ac534d2ae','8f884818-d1c0-4957-a569-f7d199350a88','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'X-Ray L'),
('e9197965-60de-46e7-af14-6ddad259f89e','98ca011c-4e15-489e-b643-e99b284f05cf','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:16',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('e98b6b54-62d2-4709-a23f-0976fb444496','e996203f-f85e-4cd6-acdf-effe05a12f40','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:16','KHEMA Polyclinic','KHEMA Polyclinic','Singapore','Singapore'),
('e9ed6a48-533b-48a0-8be7-97631ca04b40','0c862bdd-7901-4cdc-a4b2-fedf0769b082','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Billing back Left','Billing back Left'),
('ea3f5120-8a39-41d6-afb4-38c43f5217d1','aa196813-512f-4a51-93a3-99d40d8ef354','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('eba42a08-d7cf-4ca9-9abd-57188df0317d','430a8a50-5830-41a8-8b60-f902142a15a8','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:51',NULL,'Sakal Polyclinic Street 2004',NULL,'IPD2-PC1'),
('ebf5ea26-383a-47bb-8629-dd628d841911','36933e84-4fb1-4b73-842e-afc65b203897','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:51:02',NULL,'KHEMA TK',NULL,'Pharmacy Room'),
('ec759c9b-d45a-4e46-b9c1-95c9257effb0','175745e2-d564-4bd3-ae4f-2b65f4336bc8','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:21','KHEMA Polyclinic','KHEMA Polyclinic','IT','IT'),
('ed4a3c21-d571-48bc-b971-d3c4312c30a8','175745e2-d564-4bd3-ae4f-2b65f4336bc8','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:18','KHEMA  Polyclinic','KHEMA Polyclinic','IT','IT'),
('ed804e16-594f-4103-8360-3bd48ddf83a6','cedba394-180a-4c23-90be-4f143f5fe0cd','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:51','KHEMA TK','KHEMA Hospital Toul Kork','K1 Laboratory Room','K1 Laboratory Room'),
('ee10995f-ef7e-47f9-90fb-162d7cdd0cbe','9a94f268-7ca8-44cb-8493-3cf952194a27','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:12',NULL,'KHEMA Polyclinic',NULL,'Billing front left'),
('eed7d39e-f0a8-44c2-828e-d6f306875ef9','cf72013d-788a-4268-8cd9-14770dd207f5','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Pharmacy right','Pharmacy right'),
('efd698fd-52c5-4096-be68-724614c13525','e02d9301-7737-493d-9181-c1f528dd4805','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','GM','GM'),
('f0ac6ffe-c9ac-4360-8c59-8f6ccc8cecf2','82402fed-5413-4976-bf18-66f55dd948bd','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:15',NULL,'KHEMA Polyclinic',NULL,'Nurse Station'),
('f0fd5b45-1bb9-4ee8-abdb-bf84ef1a57f8','cf72013d-788a-4268-8cd9-14770dd207f5','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:13','KHEMA Polyclinic','KHEMA Polyclinic','Pharmacy right','Pharmacy right'),
('f129d69f-fab9-4711-a174-b46d3d4974e6','f78418ac-e353-404f-b8c2-f492a13afe7c','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:19','KHEMA  Polyclinic','KHEMA Polyclinic','Server','Server'),
('f15e5d87-1036-4d31-aa05-cf0c17d46a02','4d734f94-03ab-43b9-bb8a-cab350534e07','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','K1P3 Administrator Office','K1P3 Administrator Office'),
('f1918020-003c-4039-a0dc-974c128f9a4b','4ec147a4-56a1-4b5a-a443-fdf478d3cbcb','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:58',NULL,'KHEMA TK',NULL,'K1F2RICU'),
('f22f9f91-d74b-4689-811c-986da780b5ab','7a14728c-2bf3-4121-b679-cb1ce3ef9732','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:50','KHEMA TK','KHEMA Hospital Toul Kork','K1FGRICU','K1FGRICU'),
('f2dce432-f76d-4ae4-be76-3333822c079c','54cdb4f0-0295-4ca9-812e-787e3d2c82f4','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:29:27','KHEMA Polyclinic','KHEMA  Polyclinic','Endo','Endo'),
('f2e36ff6-eee9-4e0e-88b1-0e5bba63e6e5','7632441f-3c32-4941-a652-1c55869ad386','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','PHARMACY ROOM','PHARMACY ROOM'),
('f2f5c45f-a098-494f-9f50-c4f43faf34f6','05ec786f-230b-404a-8fdb-cdce535d0d6b','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Pharmacy left','Pharmacy left'),
('f30fa716-dc18-4f49-bd0f-454bb68dad53','2a1abafb-34c4-4f15-af52-dcbc1843ac40','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:16','KHEMA  Polyclinic','KHEMA Polyclinic','Relationship','Relationship'),
('f32adf33-e983-4a59-af97-9c23d275b618','98ca011c-4e15-489e-b643-e99b284f05cf','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:10','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('f352b118-b61b-4812-977a-3eada4a35544','ee5b3ea1-9d60-4e2b-a311-dbd9df898743','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:49','KHEMA TK','KHEMA Hospital Toul Kork','K1P4 Server room','K1P4 Server room'),
('f37cc71e-aadc-4ad9-8add-38af3feb6b36','8e3ad428-8fbe-4155-9bc0-24ec65f2caa9','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','LAB AIO PC','LAB AIO PC'),
('f4c9c7ea-0617-401f-9157-c8882fbc7866','2be0d8fd-e8d3-4539-bb98-613a43d6d3ca','Created Asset','Braseth Official',NULL,'',NULL,NULL,'Initial registration','2026-05-07 09:10:50',NULL,'Sakal Polyclinic Street 2004',NULL,'OPD Nurse Station PC1'),
('f4eb1bb6-e237-46f2-afd1-7eb4d63f788b','473f9e4e-1b5d-4270-93a6-e5577d00a995','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:16',NULL,'KHEMA Polyclinic',NULL,'Admin Officer'),
('f651a998-91d9-4767-a284-7bb2ee20177b','f90275f1-474d-4340-ae4f-f908d0a09428','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:37','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','Stock F4','Stock F4'),
('f67ffb9d-c641-42ee-bb36-ef77a437570c','2203f534-dbd3-4406-b1f2-a9dcc9c47996','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:18','KHEMA Polyclinic','KHEMA Polyclinic','Dr.Khimuy','Dr.Khimuy'),
('f6dd1974-0d15-472d-8b29-028c32155d29','a2e38f14-8914-4705-a547-43fb02439793','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:06','KHEMA Polyclinic','KHEMA Polyclinic','Laboratory R server','Laboratory R server'),
('f6e0d86e-95c9-43fc-8435-2f389274dbfc','afbed313-5a74-4a59-bf5e-3be59925f564','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','PC Supervisor','PC Supervisor'),
('f7703aac-dd1b-47fa-9c90-16777bdaef4e','318cb519-5a94-4566-b8e1-05e35eb834e7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:18','KHEMA Polyclinic','KHEMA Polyclinic','Echocardiography','Echocardiography'),
('f7ce32bb-9ec4-447f-bf1c-0f73024f10c6','b1a52772-b431-41c5-b60e-a7bb6c67b988','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:38:34','KHEMA Polyclinic','KHEMA  Polyclinic','Customer Service','Customer Service'),
('f7d35fbf-d222-459b-81fb-9744e7e79ecc','add5b636-2cb7-4f74-b241-87bf34d46c5f','Transferred Asset','Braseth Official','','','Active','Active','','2026-05-07 07:22:34','KHEMA Polyclinic','KHEMA  Polyclinic','Meeting Room','Meeting Room'),
('f7e5e154-3b62-40eb-87d1-204fb3066ff7','473f9e4e-1b5d-4270-93a6-e5577d00a995','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:20','KHEMA Polyclinic','KHEMA Polyclinic','Admin Officer','Admin Officer'),
('f817debb-163b-41b2-827f-7e694f1379ab','500fcc8a-f867-4da7-9286-ea4a468906da','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:19','KHEMA  Polyclinic','KHEMA Polyclinic','Display','Display'),
('f8963961-12a9-4837-a760-72a210d16dac','7df7e0e4-f34d-4e52-a06a-5af3263d1118','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:11','KHEMA Polyclinic','KHEMA Polyclinic','IT stock','IT stock'),
('f8ac7bad-11de-41d3-af5e-8bfacd4690da','318cb519-5a94-4566-b8e1-05e35eb834e7','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:15','KHEMA Polyclinic','KHEMA Polyclinic','Echocardiography','Echocardiography'),
('f8eb5912-92fc-41e8-9f37-22f62aaf2ba9','02359daf-9742-423d-ab25-4320df953df3','Reassigned Asset','Braseth Official','',NULL,NULL,'Active','','2026-05-07 09:18:34','Sakal Polyclinic Street 2004','Sakal Polyclinic Street 2004','LAB-Counter','LAB-Counter'),
('fb065a5e-0e66-489f-b059-ea28868af2d4','12131758-0acf-4b9b-bdd1-9b73f7d7d88f','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 07:21:12','KHEMA Polyclinic','KHEMA Polyclinic','Meeting Room','Meeting Room'),
('fc315dd2-6a63-4dc3-9383-132daa9c9e38','38c9381e-86c6-4d77-bdcf-98b9c333a8f6','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'IT room'),
('fcd03989-2828-4c3b-9df8-0d23216aaeb5','cf72013d-788a-4268-8cd9-14770dd207f5','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:16','KHEMA Polyclinic','KHEMA Polyclinic','Pharmacy right','Pharmacy right'),
('fd17616b-4d9c-4901-840a-84614cca12d8','d5052d98-de53-4e17-968f-1c521a3cf779','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('fd9e7381-718c-4ce5-9738-3a3f35f190fb','8a6c6f75-8332-4d26-b59c-fe2ed2cdaf73','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:17',NULL,'KHEMA Polyclinic',NULL,'Display'),
('fe2ba639-922b-4d9e-b00f-89c454799546','88193731-d103-4fdb-b1b2-6ee42be50418','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:13','KHEMA Polyclinic','KHEMA Polyclinic','Billing back right','Billing back right'),
('fedbea97-6248-48db-9010-9d083e479384','45e5a95e-b55b-426c-a307-03c5487fb305','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 04:50:57',NULL,'KHEMA TK',NULL,'K1P4 Server room'),
('ff44900b-b916-44fd-bbcf-8d063361b1d2','b1a52772-b431-41c5-b60e-a7bb6c67b988','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:10:15','KHEMA  Polyclinic','KHEMA Polyclinic','Customer Service','Customer Service'),
('ff85018a-887c-480c-9945-9572ebf33e5e','fc5e0ef4-304e-4b53-b68b-276b2407c84d','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:48','KHEMA TK','KHEMA Hospital Toul Kork','N/A','N/A'),
('ffa54240-b98c-4935-a749-f64823ec6faa','3e893cdd-2bae-41e4-acbc-bce1b55c8478','Reassigned Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 08:12:19','KHEMA Polyclinic','KHEMA Polyclinic','Nurse Station','Nurse Station'),
('ffd8ab68-9ce9-42ce-a7bb-b81f78adbc86','aa6fe63b-e119-4a3c-9f0b-6dabeef3b815','Created Asset','Braseth Official',NULL,'',NULL,'Active','Initial registration','2026-05-07 07:17:13',NULL,'KHEMA Polyclinic',NULL,'Doctor Lounge R'),
('ffed54a0-3ee3-4385-9739-ea92e26e2d64','9d824634-79ac-433d-a640-ce3ab379e11e','Transferred Asset','Braseth Official','',NULL,'Active','Active','','2026-05-07 05:16:52','KHEMA TK','KHEMA Hospital Toul Kork','Registation GF','Registation GF');
/*!40000 ALTER TABLE `it_asset_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_assets`
--

DROP TABLE IF EXISTS `it_assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_assets` (
  `id` varchar(36) NOT NULL,
  `asset_tag` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `warranty_expiry` date DEFAULT NULL,
  `assign_to` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `purchase_date` date DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `specification` text DEFAULT NULL,
  `asset_location` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_assets`
--

LOCK TABLES `it_assets` WRITE;
/*!40000 ALTER TABLE `it_assets` DISABLE KEYS */;
INSERT INTO `it_assets` VALUES
('02359daf-9742-423d-ab25-4320df953df3','K3PH000051','Computer','Sakal Polyclinic Street 2004','Dell OptiPlex 5400 AIO','Active',NULL,NULL,'','2026-05-07 09:10:49',NULL,'CN-0R97RN-PE200-27T-0781-A00','','Dell','','LAB-Counter'),
('02cef0de-6c08-46ad-9802-82c7fa1c5f92','K2PH000088','Peripheral','KHEMA Polyclinic','APC','Active',NULL,NULL,'','2026-05-07 07:17:18',NULL,'9S2135A00159','','APC','UPS 3KVA for New Server Room & Ultrasound Room','Server Room'),
('03873dcd-9320-4923-8f95-24b7d26cb4e6','K2PH000048','Computer','KHEMA Polyclinic','OptiPlex 5250 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'GMR4V72','','DELL','Ram DDR4 8GB, CPU Intel Core i3-6100, HDD 500GB.','Nurse Station'),
('03afe9fd-3914-46bb-99ff-ebdefe75118b','K3PH000020','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 3280 AIO','Active',NULL,NULL,'','2026-05-07 09:10:51',NULL,'','','Dell','','ICU'),
('0410f39f-6854-4db7-9e74-f7786ea9b54a','K1PH000123','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:03',NULL,'','13th Gen Intel Core i5-13500T,Serial 5CM6414','Dell','Desktop Dell Optiplex AIO Plus 7410','Pharmacy Room'),
('05ec786f-230b-404a-8fdb-cdce535d0d6b','K2PH000092','Computer','KHEMA Polyclinic','OptiPlex 5400 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:12',NULL,'BJZWZQ3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-12500T, SSD 256 GB','Pharmacy left'),
('06dc6d9f-8621-4fe2-a126-5d289f166918','KGPH000008','Laptop','KHEMA GLOBAL CO.,LTD','Laptop Dell XPS 13 Plus-9320','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','KG-CFO','Dell','Laptop Dell XPS 13 Plus-9320','KG-CFO'),
('082df062-5076-4f8e-b266-0e4491f39706','KGPH000013','Laptop','KHEMA GLOBAL CO.,LTD','Laptop Lenovo Thinkpad E15','Active',NULL,NULL,'','2026-05-07 07:45:43',NULL,'','Uesd Mr. Pich','Lenovo','Laptop Lenovo Thinkpad E15','HR Officer'),
('085d137b-4d95-4fc0-b47b-8e016917a468','KGPH000010','Computer','KHEMA GLOBAL CO.,LTD','Dell Optlplex 7410 AIO','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','Accounting (Tey),Serial: CBM6414','Dell','Dell Optlplex 7410 AIO','Accounting (Phai Nor)'),
('09d333fc-38b4-4923-9338-3f447f7a18bd','K1PH000060','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','Used in Meeting RF/K1P4','Logitech ','Video Conferencing System@K1P3','Meeting Room'),
('0b83acc3-3f39-4d57-b920-d05d9974f14f','K2PH000063','Computer','KHEMA Polyclinic','OptiPlex 5270','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'8SMCRZ2','','DELL','21.5 inch, Ram DDR4 8GB, CPU Intel Core i5-9500(6 cores), HDD 1TB.','Nurse Station'),
('0c100323-ce55-4923-919d-19483093abc6','K3PH000006','Peripheral','Sakal Polyclinic Street 2004','EPSON L6170','Active',NULL,NULL,'','2026-05-07 09:10:53',NULL,'X4EY036511','','Epson','','Back OFFICE'),
('0c188d35-5850-485b-89c5-eaeab616c97a','K2PH000049','Computer','KHEMA Polyclinic','OptiPlex 3240 All-in-One','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'GMR6H82','','DELL','Ram DDR4 8GB, CPU Intel Core i3-6100, HDD 500GB','Laboratory L'),
('0c862bdd-7901-4cdc-a4b2-fedf0769b082','K2PH000096','Computer','KHEMA Polyclinic','OptiPlex 5400 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:12',NULL,'FF595S3','','DELL','Ram 8GB, CPU Intel Core i5-12500T, SSD 256GB','Billing back Left'),
('12131758-0acf-4b9b-bdd1-9b73f7d7d88f','K2PH000081','Peripheral','KHEMA Polyclinic','N/A','Active',NULL,NULL,'','2026-05-07 07:17:18',NULL,'','','N/A','PSW-100N, Swing Door Operrator 100kg & 1200mm Wide ','Meeting Room'),
('12b6cac6-a8e3-4431-a9f3-64a1ffbe2ed0','KGPH000006','Laptop','KHEMA Polyclinic','Dell Latitude 5420','Active',NULL,NULL,'','2026-05-07 04:03:26',NULL,'82HT2J3','','DELL','14inch, Ram DDR4 8GB, CPU Intel Core i7-1165G7, M2 512GB.','Marketing Room'),
('149ad0aa-827f-4595-b28d-274b8d4eb3c5','K1PH000009','Computer','KHEMA Hospital Toul Kork','Dell Optiplex 3240 AIO Intel i5-6500 CPU 3.20GHz RAM8GB','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','Keeping in K1P4 Server room, Serial: HKFM8F2','Dell','Computer -Mouse(1) -keyboards(1)','K1P4 Server room'),
('15af75e1-51e0-46c6-8a21-90856186f5b7','K3PH000018','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 3280 AIO','Active',NULL,NULL,'','2026-05-07 09:10:49',NULL,'9SN5X63','Customer Service Counter billing PC','Dell','','BILLINGGF'),
('175745e2-d564-4bd3-ae4f-2b65f4336bc8','K2PH000066','Laptop','KHEMA Polyclinic',NULL,'Active',NULL,NULL,'','2026-05-07 07:17:17',NULL,'K7N0CV05W67028E','','Asus','AMD R5-2500U-DDR 4GB-HDD 1TB SATA-Nvidia GTX1050-4','IT'),
('1a3e8dc5-772d-4dfb-953e-a3bfa95f9aa5','K1PH000094','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','Keeping in Server Room K1P4','Dell','Dell Optiplex 5400 All-in-One','K1P4 Servcer Room'),
('1be76a13-360b-4599-b0d7-cecfe227d31b','K3PH000054','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 7420 QDAIO','Active',NULL,NULL,'','2026-05-07 09:10:50',NULL,'','','Dell','','Sakal AP'),
('1c78c247-8bf7-4998-97e3-dbe400650061','K1PH000011','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','K1P3 Treatment Room,Serial: HK9J8F2','Dell','Computer -Mouse(1) -Keyboards(1)','K1P3 Treatment Room'),
('1e02fca7-50b3-41b4-b1e4-d4cbc7d2e71c','K2PH000056','Computer','KHEMA Polyclinic','OptiPlex 3240 All-in-One','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'GMQZG82','','DELL','Ram DDR4 8GB, CPU Intel Core i3-6100, HDD 500GB.','IT room'),
('1f1288c2-aa4e-488d-9646-bc421f3f219c','K1PH000061','Computer','KHEMA Hospital Toul Kork','Dell Latitude 5410 Intel i5-10210U CPU 1.60GHz RAM16G','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','Used by Mis.NEOU Sotharoath, Dell Latitude 5410 Intel Core i5-10210U CPU @ 1.60GHz , Serial 55HX573','Dell','Computer Dell Labtop for Ms. Touch','Medical Stock'),
('200814ef-a2a0-43c6-a1b7-fab0ef0e2845','K1PH000047','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','Keeping in K1P4 Server room CN-07PXVC-PE200-88C-0614-A00','Dell','Dell Optiplex 5260 AIO21.5\'\' FHD 1920*1080 IPS Touch','K1P4 Server room'),
('202a0a90-f2f1-4a30-9306-636bb34a959c','K1PH000027','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','Keeping in K1P4 Server room (Used in Server Rack),Serial 7RVHB2S','Dell','Sever -Monitor + UPS + Mouse -Telephone System -Camara System( office. Eq)','K1P4 Server room'),
('2203f534-dbd3-4406-b1f2-a9dcc9c47996','K2PH000102','Computer','KHEMA Polyclinic','Optiplex5400 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:14',NULL,'JC595S3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-12500T, SSD 256 GB','Dr.Khimuy'),
('22ed9c7b-3c4d-445b-98ac-f8da8691fd44','K1PH000086','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','Serial: DXHWG53 Pediatrics Consultation','Dell','Dell OptiPlex 3280 AIO Core i5-10500T 8GB (1x8GB)','K1P3 Pediatrics Consultation'),
('23ebd2df-1227-4fbb-a5e6-5fc0fe24a139','K1OE000008','Peripheral','KHEMA Hospital Toul Kork','K1P3-Phone System PABX','Active',NULL,NULL,'','2026-05-07 04:51:03',NULL,'','','Panasonic','K1P3-Phone System PABX','K1P3 Server room'),
('24de18aa-1619-4e9f-bc49-43a2d83cbd34','K1PH000084','Peripheral','KHEMA Hospital Toul Kork','UPS Power Supplie trupower ','Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','SEMI ICU','trupower ','UPS Power Supplie trupower ','K1FGRICU'),
('29ae9c4f-89dd-40e2-9afb-7b6309f09ce4','K2PH000033','Computer','KHEMA Polyclinic','OptiPlex 3240 All-in-One','Active',NULL,NULL,'','2026-05-07 07:17:14',NULL,'HBC9S62','','DELL','Ram DDR4 12GB, CPU Intel Core i5-12500T(6 cores), HDD 1TB.','Appointment Center'),
('2a1abafb-34c4-4f15-af52-dcbc1843ac40','K2PH000039','Computer','KHEMA Polyclinic','OptiPlex 3240','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'HBB4V72','','DELL',' Ram DDR4 8GB, CPU Intel Core i5-6500, SSD 500GB.','Relationship'),
('2be0d8fd-e8d3-4539-bb98-613a43d6d3ca','K3PH000010','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 3280 AIO','Active',NULL,NULL,'','2026-05-07 09:10:50',NULL,'','','Dell','','OPD Nurse Station PC1'),
('2de85bc6-c770-4453-93fd-668f445e3068','K3OE000005','CCTV','Sakal Polyclinic Street 2004','CS-C3W-A0-3H4WFRL','Active',NULL,NULL,'','2026-05-07 09:10:53',NULL,'','Sent to K1','Eviz','','K1'),
('312abde0-a6c3-43b4-8d9c-eb73903487ec','K2PH000084','Computer','KHEMA Polyclinic','Dell Optiplex 5490 AIO','Active',NULL,NULL,'','2026-05-07 07:17:11',NULL,'BWQNRH3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-11500T(6 cores), SSD 500GB.','Customer Service'),
('318cb519-5a94-4566-b8e1-05e35eb834e7','K2PH000038','Computer','KHEMA Polyclinic','OptiPlex 3070 Tower','Active',NULL,NULL,'','2026-05-07 07:17:14',NULL,'8VD1R13','','DELL','Ram 8GB, CPU Intel Core i3-9100, HDD 1TB','Echocardiography'),
('330728e5-92cb-4cc0-b6c3-daa9d3318dae','K1PH000079','Laptop','Sakal Polyclinic Street 2004','Laptop Latitude 3410','Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','','Dell','','IT office (IT Locker)'),
('338fed14-8181-4ec9-9e4f-2fe4c12da90d','K3PH000027','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 3280 AIO','Active',NULL,NULL,'','2026-05-07 09:10:49',NULL,'','','Dell','','ER-NursePC2'),
('353642c7-bcaa-46f6-8d3e-625407f5b275','K3OE000012','CCTV','Sakal Polyclinic Street 2004','CS-C3W-A0-3H4WFRL','Active',NULL,NULL,'','2026-05-07 09:10:54',NULL,'','','Eviz','','Stock F4'),
('3666824f-1b9b-43d4-ad21-45f3724197d0','K1PH000105','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:01',NULL,'','B760M GAMING X AX DDR4, 12th Gen Intel Core i7-12700 16GB, (Clone PC)','Dell','DESKTOP-HeadIT','K1P4 Server room'),
('36933e84-4fb1-4b73-842e-afc65b203897','K1PH000122','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:02',NULL,'','13th Gen Intel Core i5-13500, Serial DWW4324','Dell','Desktop Dell Optiplex AIO Plus 7410','Pharmacy Room'),
('369b2695-e586-4bb0-9f19-5ac43aaef00e','K1OE000011','Laptop','Sakal Polyclinic Street 2004','MSI gaming','Active',NULL,NULL,'','2026-05-07 04:51:03',NULL,'','Transfer From laptop COO','MSI','',' Relationship Officer'),
('36e49592-22e0-453c-a7ac-218f5494b4b1','KGPH000011','Computer','KHEMA GLOBAL CO.,LTD','Dell Optlplex 7410 AIO','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','Accounting (Nam Sreyroth),Serial: DBM6414 ','Dell','Dell Optlplex 7410 AIO','Accounting (Nam Sreyroth)'),
('38c9381e-86c6-4d77-bdcf-98b9c333a8f6','K2PH000095','Computer','KHEMA Polyclinic','OptiPlex 5400 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'JKZWZQ3','','DELL','Ram 8GB, CPU Intel Core i5-12500T, SSD 256GB','IT room'),
('3a37e11f-ffe8-4be0-988e-882903aa910c','K1PH000111','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:01',NULL,'','13th Gen Intel Core i5-13500, Serial: FWW4324','Dell','Desktop Dell Optiplex AIO Plus 7410','OPD NURSE STATION PC1'),
('3a9ad1d8-efd2-4df3-885a-503970c80db6','K1PH000089','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','K1P3 Billing,Serial: CF0Y1L3','Dell','Dell Optiplex 5490 AIO Core I5-11500T 8GB','K1P3 Billing'),
('3afbda1d-227f-41b8-a50c-98869e4adc45','K1PH000010','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','Dell Optiplex AIO 3240 Keeping in Server Room K1P4','Dell','Computer -Mouse(1) -Keyboaeds(1) -TRV POWER(1)','K1P4 Servcer Room'),
('3b721875-c689-4b04-a332-8b93cb3a32a5','K2PH000101','Computer','KHEMA Polyclinic','OptiPlex 5400 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'4F595S3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-12500T, SSD 256 GB','CT-Scan R'),
('3cb5e7be-78c9-4a2a-9740-f6b110a63d56','KGPH000004','Laptop','Sakal Polyclinic Street 2004','Lenovo ThinkPad X1 Carbon G9','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','','Lenovo','','Chief account SAKAL'),
('3e893cdd-2bae-41e4-acbc-bce1b55c8478','K2PH000004','Computer','KHEMA Polyclinic','OptiPlex 5250 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'GZHCHJ2','','DELL','Ram 8GB, CPU Intel Core i3-7100, HDD 1TB','Nurse Station'),
('40d0cd39-20a8-4b12-ab14-08f0d07fd0ba','K3OE000011','CCTV','Sakal Polyclinic Street 2004','CS-C3W-A0-3H4WFRL','Active',NULL,NULL,'','2026-05-07 09:10:54',NULL,'','','Eviz','','Stock F4'),
('42a94141-8684-4b16-b7db-77c55de73cb0','K3OE000014','CCTV','Sakal Polyclinic Street 2004','CS-C3W-A0-3H4WFRL','Active',NULL,NULL,'','2026-05-07 09:10:54',NULL,'','','Eviz','','Stock F4'),
('430a8a50-5830-41a8-8b60-f902142a15a8','K3PHXXXXXX','Computer','Sakal Polyclinic Street 2004','Dell AIO','Active',NULL,NULL,'','2026-05-07 09:10:51',NULL,'','not yet have label fixed asset code','Dell','','IPD2-PC1'),
('433fdefa-1827-44ab-afcb-e419c53b20c8','K1PH000087','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','K1P3 Consultation Room,Serial: GG0Y1L3','Dell','Dell Optiplex 5490 AIO Core I5-11500T 8GB','K1P3 Consultation Room'),
('4560cead-74b2-4e17-bab8-3152f40616dd','K1PH000082','Computer','KHEMA Hospital Toul Kork','Dell all in one Optitlex 3280','Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','Intel Core i5-10500T CPU @ 2.30GHz, Serial: CV18ZH3','Dell','Dell all in one Optitlex 3280','K1FGRICU'),
('459824e8-34d6-4243-aee0-d4179d68725b','K1PH000101','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','Used by Mr.Chanthorn (Pich), 12th Gen Intel Core i5-12500T, Serial: 3C595S3','Dell','Dell Optiplex 5400 AIO','K1P3 Administrator Office'),
('45e5a95e-b55b-426c-a307-03c5487fb305','K1PH000062','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','Keeping K1P4 Server room','Dell','Dell Optiplex 5060MT Core i5-8500 4GB (1*4GB) DDR4 1TB 3.5\'\' ','K1P4 Server room'),
('473f9e4e-1b5d-4270-93a6-e5577d00a995','K2PH000105','Computer','KHEMA Polyclinic',' OptiPlex AIO 7410','Active',NULL,NULL,'','2026-05-07 07:17:16',NULL,'BTP6414','','DELL','Ram DDR4 8GB, CPU Intel Core i5-1350T, SSD 500GB.','Admin Officer'),
('47937e22-0b7b-4183-b77f-8bca94ae21eb','K2PH000073','Laptop','Sakal Polyclinic Street 2004','Dell latitude 5410','Active',NULL,NULL,'','2026-05-07 09:10:52',NULL,'','','Dell','','Home Care K3'),
('491d5d18-7308-4c90-a2b1-bf0eba31df11','K2PH000050','Computer','KHEMA Polyclinic','OptiPlex 5270 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'8SHDRZ2','','DELL','Ram 8GB, CPU Intel Core i5-9500, SSD 500GB','Gynecologist Room'),
('4a2b46d3-0ab9-4802-8ca2-05425742c046','K1PH000072','Computer','KHEMA Hospital Toul Kork','Dell all in One Optiplex 3280 ','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','Hemodialysis','Dell','Dell all in One Optiplex 3280 ','K12FRHemo'),
('4a7cce36-2044-449d-8c8e-3ead5211bd60','K2PH000028','Computer','KHEMA Polyclinic','OptiPlex 5250 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:14',NULL,'733Y9P2','','DELL','Ram DDR4 4GB, CPU Intel Core i3-7100, HDD 500GB','Stock Controller'),
('4c008e83-6c85-498f-8c68-5d781851f70f','K3PH000045','Laptop','Sakal Polyclinic Street 2004','Dell Latitude 3510 AIO','Active',NULL,NULL,'','2026-05-07 09:10:51',NULL,'','','Dell','','IT Support Laptop'),
('4c545a11-7742-475f-916f-0dea7e3f364b','K2FF000005','Peripheral','KHEMA Polyclinic','LG TV','Active',NULL,NULL,'','2026-05-07 07:17:17',NULL,'510INEW38596','','LG','43LX540S Display Screen','Display'),
('4ca32c40-d49f-4b48-842d-01b5b4291463','K1PH000085','Peripheral','KHEMA Hospital Toul Kork','UPS Power Supplie trupower ','Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','SEMI ICU','trupower ','UPS Power Supplie trupower ','K1FGRICU'),
('4cb512f9-b48f-498a-916c-8bc30e6fb8e2','KGPH000090','Storages','KHEMA Polyclinic','DS1522+','Active',NULL,NULL,'','2026-05-07 07:17:17',NULL,'2230RYR19HXEX','','Synology','SYNOLOGY STORAGE DEVICE FOR K2 PLUS 5-BAY NAS RAM (8GB)','IT'),
('4cf10155-e5f8-4ae1-b9a5-b1b95d61e5fc','K2PH000099','Computer','KHEMA Polyclinic','OptiPlex 5400 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'CD595S3','','DELL','Ram 8GB, CPU Intel Core i5-12500T, SSD 256GB','Nurse Station'),
('4d032be0-887e-4719-87d2-519f97781b04','K2FF000006','Peripheral','KHEMA Polyclinic','LG TV','Active',NULL,NULL,'','2026-05-07 07:17:17',NULL,'604INPT3J744','','LG','55LX540S Meeting 9Floor','Meeting'),
('4d734f94-03ab-43b9-bb8a-cab350534e07','K1PH000103','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:01',NULL,'','Used by Mr.Dara, 12th Gen Intel Core i5-12500T 8GB, Serial: CC595S3','Dell','Dell Optiplex 5400 AIO','K1P3 Administrator Office'),
('4ec147a4-56a1-4b5a-a443-fdf478d3cbcb','K1PH000070','Computer','KHEMA Hospital Toul Kork','Dell all in One Optiplex 3280 ','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','2F ICU Nurse Station, Dell  OptiPlex 3280 AIO Intel Core i5-10500T CPU @ 2.30GHz, Serial: BV18ZH3','Dell','Dell all in One Optiplex 3280 ','K1F2RICU'),
('500fcc8a-f867-4da7-9286-ea4a468906da','K2FF000001','Peripheral','KHEMA Polyclinic','LG TV','Active',NULL,NULL,'','2026-05-07 07:17:17',NULL,'512INQU0S388','','LG','43LX540S Display Screen','Display'),
('5010d1bd-8e1b-4737-8e02-b5910694a798','KGPH000005','Laptop','KHEMA GLOBAL CO.,LTD','Laptop Dell Latitude 5420 CTO Base','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','B.PHANG Sophea EHS Manager ','Dell','Laptop Dell Latitude 5420 CTO Base','EHS Manager KG'),
('505ff021-5a49-43b7-9c81-83a540d755b8','K2PH000098','Computer','KHEMA Polyclinic','OptiPlex 5400 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:11',NULL,'4D595S3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-12500T(6 cores), SSD 256GB.','Nurse Station R'),
('5094234e-4c6c-4a2d-a2a9-b3d3e699fd2a','K1PH000116','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:02',NULL,'','Spacialist & Consultation GF','Dell','Desktop Dell Optiplex AIO Plus 7410','Spacialist & Consultation GF'),
('5163b589-6b7c-4827-b361-7eb289368d57','K1PH000042','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','Dell Optiplex 5250 AIO i5-7500 CPU 3.4GHz, Serial: HMQWCK2','Dell','Computer -Mouse(1) -Keyboards(1)','Cashier GF'),
('52e5bc6f-3835-4632-889a-867a37c04841','K1FF000049','Peripheral','KHEMA Hospital Toul Kork','LG 55\" UHD 4K Smart CTV','Active',NULL,NULL,'','2026-05-07 04:51:03',NULL,'','Ground Floor Patient Lounge K1P4','LG','LG 55\" UHD 4K Smart CTV','Ground Floor Patient Lounge K1P4'),
('5439a8f3-cd07-4d9a-a869-b14fd59e9c33','K1PH000097','Peripheral','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','HP Z240 Tower Workstation  Intel Xeon CPU E3-1225 v5 @ 3.30GHz,Serial:4CV733W48M,Device Name DESKTOP-01J24GQ','Dell','Snibe analyzer PC','K1 Laboratory Room'),
('54cdb4f0-0295-4ca9-812e-787e3d2c82f4','K2PH000011','Computer','KHEMA Polyclinic','Optiplex3240','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'GMR3V72 ','','DELL','Ram DDR4 8GB, CPU Intel Core i3-7100, HDD 500GB.','Endo'),
('55a66228-6ef1-4e9d-8782-0e6f8089c48e','K3OE000007','CCTV','Sakal Polyclinic Street 2004','CS-C3W-A0-3H4WFRL','Active',NULL,NULL,'','2026-05-07 09:10:54',NULL,'','','Eviz','','Stock F4'),
('55e85173-0630-460d-8a07-0a1a069f40d6','K3PH000001','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 7080MT','Active',NULL,NULL,'','2026-05-07 09:10:49',NULL,'9NW6X63','','Dell','','LAB System uniqe '),
('5867fdce-06e8-4f8e-b82a-23c625a6eae3','K3PH000050','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 5400 AIO','Active',NULL,NULL,'','2026-05-07 09:10:51',NULL,'','','Dell','','IT Support Desktop'),
('5c6ee4e9-f886-47e1-87bb-296d0ce8ae33','KGPH000018','Laptop','KHEMA GLOBAL CO.,LTD','Intel Ultra 7 266V, vPro,RAM 16GB, 1TB SSD','Active',NULL,NULL,'','2026-05-07 07:45:43',NULL,'','Uesd Bong Ratana','Dell','Dell Pro 14 Plus (PB14250) XCTO Base','KG-COO'),
('5f2064c6-9c37-4500-85f3-5e6f59a08c88','K2PH000097','Computer','KHEMA Polyclinic','OptiPlex 5400 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'JB595S3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-12500T(6 cores), SSD 256GB.','Nurse Station'),
('60982e4b-cf01-4842-9de3-9b7a4ab3543e','K1PH000012','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','Dell OptiPlex 3240 AIO Intel Core i5-6500 CPU @ 3.20GHz, Serial: HJWJ8F2','Dell','Computer -Mouse(1) -Keyboards(1) -UPS(1)','Cardiology Room'),
('615581db-5cce-4c98-89fe-7731f1a03797','K1PH000077','Computer','KHEMA Hospital Toul Kork','Dell all in One Optiplex 3280 ','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','Intel Core i5-10500T CPU @ 2.30GHz, Serial: 4T18ZH3','Dell','Dell all in One Optiplex 3280 ','MT Room'),
('626de88f-d7ba-4404-827b-d5566f4ff713','K3PH000007','Peripheral','Sakal Polyclinic Street 2004','EPSON L6170','Active',NULL,NULL,'','2026-05-07 09:10:53',NULL,'X4EY036279','','Epson','','NURSE COUNTER Floor 3'),
('64604375-50dd-403f-8701-1e662ec17541','K1PH000095','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','12th Gen Intel Core i5-12500T,Serial: BLZWZQ3','Dell','Dell Optiplex 5400 All-in-One','Cashier GF'),
('655e6c0d-21fd-4acb-9ce8-2e4aaa474bda','K3PH000022','Computer','Sakal Polyclinic Street 2004','Dell AIO','Active',NULL,NULL,'','2026-05-07 09:10:50',NULL,'','','Dell','','3F-IPD-PC2'),
('669ab636-d2ca-43a2-83e7-ec65b24bf3f4','K1PH000088','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','11th Gen Intel Core i5-11500T @ 1.50GHz, Serial: 8F0Y1L3','Dell','Dell Optiplex 5490 AIO Core I5-11500T 8GB','Maintenance Room'),
('67b5b803-b1dc-48c4-865d-4b8540ab9935','K2PH000091','Computer','KHEMA Polyclinic','OptiPlex 5400','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'','','DELL',' Ram DDR4 16GB Upgraded, CPU Intel Core i5-12000T, SSD 250GB.','Doctor lounge'),
('6c331b42-c7db-40f9-98c2-785af6c1e0ea','K1PH000069','Computer','KHEMA Hospital Toul Kork','Computer Dell ALL IN ONE','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','2F GI Endoscopy Room','Dell','Computer Dell ALL IN ONE','GI Endoscopy Room'),
('6d139f8f-1e0f-411d-a3ef-a6c95ebf1937','K1PH000099','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','Dell OptiPlex 380 Pentium Dual-Core CPU E5800 @ 3.20GHz, Serial: G2CKVBX, Device Name LAB','Dell','Biochemistry PC','K1 Laboratory Room'),
('6d276d74-f851-4a99-bdf6-75b200eb9cf1','K1PH000119','storages','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:02',NULL,'','K1P4 Server room (Used in Server Rack)','Synology','Synology Diskstation DS923+4Bays NAS(Up to 9Bays) for K1P4 Server Room','K1P4 Server room'),
('6f81df53-a429-483e-84c7-dfa1d9c06ad7','K3PH000012','Laptop','Sakal Polyclinic Street 2004','Dell Latitude 5410 BTX Base','Active',NULL,NULL,'','2026-05-07 04:03:26',NULL,'','','Dell','','Home Care K3'),
('7165d2e5-478e-45c0-8165-965892885545','K1FF000048','Peripheral','KHEMA Hospital Toul Kork','LG 55\" UHD 4K Smart CTV','Active',NULL,NULL,'','2026-05-07 04:51:03',NULL,'','1Floor patient lounge K1P4','LG','LG 55\" UHD 4K Smart CTV','1Floor patient lounge K1P4'),
('72a1e62a-96ca-4280-bc21-95c4af4f19d3','K1PH000053','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','K1 Control Room X-Ray, Serial: 9XPW8T2 ','Dell','Dell Optiplex 5260 AIO21.5\'\' FHD 1920*1080 IPS Touch','K1 Control Room X-Ray'),
('72c53bf9-a7b2-4b64-bb6b-75d50779d03b','K2PH000103','Computer','KHEMA Polyclinic','iMac 2019 ','Active',NULL,NULL,'','2026-05-07 07:17:16',NULL,'C02ZN0YBJV3X','','iMAC','Computer iMac 27\'\'Retina 5K (2019) Apple','Marketing Room'),
('73238c59-55b0-4fcf-8a6f-088a624acc44','K2PH000080','Peripheral','KHEMA Polyclinic','N/A','Active',NULL,NULL,'','2026-05-07 07:17:18',NULL,'','','N/A','PSW-100N, Swing Door Operrator 100kg & 1200mm Wide ','IT room'),
('73365d71-a258-4050-a8b9-2a226c7731ec','K1OE000009','Peripheral','KHEMA Hospital Toul Kork','Printer Membership Card ','Active',NULL,NULL,'','2026-05-07 04:51:03',NULL,'','Keeping in locker ','Evolis','Printer Membership Card ','Keeping in locker '),
('750cf041-a6ca-4348-95ae-9ebccd3eaa5e','K1PH000090','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','K1P3 Customer Service, Serial: JD0Y1L3 ','Dell','Dell Optiplex 5490 AIO Core I5-11500T 8GB','K1P3 Customer Service'),
('751e92a7-5820-424b-85f1-450e2c7202a9','K2FF000003','Peripheral','KHEMA Polyclinic','LG TV','Active',NULL,NULL,'','2026-05-07 07:17:17',NULL,'611VNHJ1C353','','LG','43LH511T Monitoring Camera Security','Server'),
('7632441f-3c32-4941-a652-1c55869ad386','K3PH000003','Peripheral','Sakal Polyclinic Street 2004','EPSON L6170','Active',NULL,NULL,'','2026-05-07 09:10:53',NULL,'X4EY036516','','Epson','','PHARMACY ROOM'),
('7704aaec-9131-40df-ad65-3852404a056f','K2PH000089','Peripheral','KHEMA Polyclinic','APC','Active',NULL,NULL,'','2026-05-07 07:17:18',NULL,'9S2135A00227','','APC','UPS 3KVA for New Server Room & Ultrasound Room','Server Room'),
('773e6af6-61c9-48b8-a679-49047289e5a1','K1PH000124','storages','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:03',NULL,'','Serial: 9009d08ba0f9','Synology','Synology (DS1525+)','K1P4 Server room'),
('7862b2ba-db1e-412a-883a-a375fdb00c70','K1PH000051','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','Using Server KuMa','Motile ','Brand Motile 5060 Min Towe-Intel core i5-8500 ','K3 Server Room'),
('7a14728c-2bf3-4121-b679-cb1ce3ef9732','K1PH000081','Computer','KHEMA Hospital Toul Kork','Dell all in one Optitlex 3280','Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','Intel Core i5-10500T CPU @ 2.30GHz, Serial: FX18ZH3','Dell','Dell all in one Optitlex 3280','K1FGRICU'),
('7b880445-c104-4f59-9d0d-d2680988f643','K3OE000008','CCTV','Sakal Polyclinic Street 2004','CS-C3W-A0-3H4WFRL','Active',NULL,NULL,'','2026-05-07 09:10:53',NULL,'','','Eviz','','Stock F4'),
('7bf36e5d-6aee-4b7c-bd8f-735bf0816077','KGPH000012','Computer','KHEMA GLOBAL CO.,LTD','Dell Optlplex 7410 AIO','Active',NULL,NULL,'','2026-05-07 07:45:43',NULL,'','Lergaden Office ','Dell','Dell Optlplex 7410 AIO','Procurement Manager '),
('7d203b4b-8a16-4bbd-90e6-8d3e5e4654ae','K3PH000024','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 3280 AIO','Active',NULL,NULL,'','2026-05-07 09:10:50',NULL,'','','Dell','','Dr-Logue'),
('7d4ecd42-dba9-424f-9e36-cccd0992189f','K1PH000114','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:02',NULL,'','13th Gen Intel Core i5-13500, Serial 5WW4324','Dell','Desktop Dell Optiplex AIO Plus 7410','Nurse station 3F'),
('7d735f2a-451a-47f7-ac25-fb9ebbea3768','K1PH000125','Laptop','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:03',NULL,'','Used By IT - Serial: T9N0CV08B33937B','ASUS','LAPTOP ASUS VIVOBOOK 15 ','K1P4 Server room'),
('7dc41574-9d8a-4102-a1a5-1035051a27ff','K3PH000002','Peripheral','Sakal Polyclinic Street 2004','EPSON L6170','Active',NULL,NULL,'','2026-05-07 09:10:52',NULL,'X4EY036469','','Epson','','CUSTOMER SERVICE COUNTER'),
('7df7e0e4-f34d-4e52-a06a-5af3263d1118','K2OE000003','Peripheral','KHEMA Polyclinic','PRINTER RICOH','Active',NULL,NULL,'','2026-05-07 07:17:17',NULL,'','','RICOH','','IT stock'),
('7f4d3152-e276-4c06-81ed-ed72bd57130f','K1PH000118','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:02',NULL,'','ER Nurse Station','Dell','Desktop Dell Optiplex AIO Plus 7410','ER Nurse Station'),
('7f65dfbc-0e78-4584-8526-864ade04f63d','K1PH000115','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:02',NULL,'','2F Nurse Station PC 1','Dell','Desktop Dell Optiplex AIO Plus 7410','Nurse station 2F'),
('81b0ab93-a745-4697-8cf5-dabddeb6d857','K1PH000121','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:02',NULL,'','13th Gen Intel Core i5-13500, Serial: HWW4324','Dell','Desktop Dell Optiplex AIO Plus 7410','ER Customer Service'),
('82402fed-5413-4976-bf18-66f55dd948bd','K2PH000035','Computer','KHEMA Polyclinic','OptiPlex 3240 All-in-One','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'GMQY992','','DELL','Ram DDR4 8GB, CPU Intel Core i5-6100, HDD 500GB','Nurse Station'),
('824f1658-b08e-4d6b-a314-c15ee339f335','K1PH000067','Computer','KHEMA Hospital Toul Kork','Computer Laptop Dell - Mr.Sophorn','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','Nurse Station Laptop Dell Latitude 3410 Inter i5-10210U CPU 1.60GHz','Dell','Computer Laptop Dell-Mouse-1set','Nurse Station 1F'),
('833ffb4c-6cce-4978-9f4a-e30c455994ba','K3OE000010','CCTV','Sakal Polyclinic Street 2004','CS-C3W-A0-3H4WFRL','Active',NULL,NULL,'','2026-05-07 09:10:54',NULL,'','','Eviz','','Stock F4'),
('87581c15-dd83-4047-88d5-e161de4ceadd','K3PH000053','Computer','Sakal Polyclinic Street 2004','Dell AIO','Active',NULL,NULL,'','2026-05-07 09:10:50',NULL,'','','Dell','','Billing PC'),
('88193731-d103-4fdb-b1b2-6ee42be50418','K2PH000061','Computer','KHEMA Polyclinic','OptiPlex 5270 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:12',NULL,'8SQJRZ2','','DELL','Ram DDR4 8GB, CPU Intel Core i5-9500, SSD 500GB','Billing back right'),
('887884b7-f5d9-4cec-899f-1a9e93fb5520','K2PH000040','Computer','KHEMA Polyclinic','Optiplex 3240','Active',NULL,NULL,'','2026-05-07 07:17:14',NULL,'CN-000N7J-74431-651-1505-A00','','DELL','Ram DDR4 8GB, CPU Intel Core i5-6100, HDD 500GB','Housekeeper'),
('8a6c6f75-8332-4d26-b59c-fe2ed2cdaf73','K2FF000004','Peripheral','KHEMA Polyclinic','LG TV','Active',NULL,NULL,'','2026-05-07 07:17:17',NULL,'604INHZ3J745','','LG','55LX540S Display Screen','Display'),
('8cf70bed-d285-45ef-81ce-d728fcec476a','K1PH000120','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:02',NULL,'','ER Nurse Station','Dell','Desktop Dell Optiplex AIO Plus 7410','ER Nurse Station'),
('8df77ab2-7848-46ab-b944-1ebf0ef64cfa','K3PH000052','Laptop','Sakal Polyclinic Street 2004','Laptop Latitude 7410','Active',NULL,NULL,'','2026-05-07 09:10:51',NULL,'','','Dell','','GM PC(Move to Pediatrics)1F'),
('8e3ad428-8fbe-4155-9bc0-24ec65f2caa9','K3PH000026','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 5480 AIO','Active',NULL,NULL,'','2026-05-07 09:10:49',NULL,'','','Dell','','LAB AIO PC'),
('8f884818-d1c0-4957-a569-f7d199350a88','K2PH000030','Computer','KHEMA Polyclinic','OptiPlex 5250 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'22JMRK2','','DELL','Ram DDR4 8GB, CPU Intel Core i3-7100, HDD 1TB','X-Ray L'),
('8f964b71-c230-4ca7-8d39-6a22cc8c6496','K1PH000074','Computer','KHEMA Hospital Toul Kork','Dell all in One Optiplex 3280 ','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','Uesd by Mr.TAING Mengly, Dell Optiplex 3280 AIO, Intel Core i5-10500T CPU @ 2.30GHz, Serial DXGTG53','Dell','Dell all in One Optiplex 3280 ','Medical Stock'),
('9173ce52-ecc2-4a0e-badf-51e4c526dfa4','K2PH000051','Computer','KHEMA Polyclinic','OptiPlex 5270 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:11',NULL,'8SNKRZ2','','DELL','Ram DDR4 8GB, CPU Intel Core i3-9500, SSD 500GB.','Nurse Station L'),
('9228a5a9-e38c-4426-adf0-d1cb761a60e9','K2PH000012','Computer','KHEMA Polyclinic','Optiplex5250','Active',NULL,NULL,'','2026-05-07 07:17:16',NULL,'GMQW992','','DELL','Ram DDR4 8GB, CPU Intel Core i3-7100, HDD 500GB.','Nurse Station'),
('93094518-a392-435e-ba6f-09e718362b55','K1PH000065','Computer','KHEMA Hospital Toul Kork','Computer Dell ALL IN ONE - 2pcs for IPD room and P','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','Used By RelationShip Officer, OptiPlex 3280 AIO Intel Core i5-10500T CPU @ 2.30GHz, Serial: 1GHXB33','Dell','Computer Dell+Mouse+Keyboard-1Set','Administration Office'),
('93cee1f1-2c3d-4a93-9c0c-16f7331ca9e4','K1PH000068','Laptop','KHEMA Hospital Toul Kork','Laptop Dell 5400 - Chhe Chanserey','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','Used by Bong.Chim Chhay Aun, Dell Latitude 5400 Intel Core i5-8265U CPU @ 1.60GHz 16GB, Serial: 2GDK533','Dell','Computer Laptop Dell+Mouse-1Set','Accountant Office'),
('93d472d8-f4da-49f2-9f5c-ddba264aa9e0','K2PH000052','Computer','KHEMA Polyclinic','Optiplex3240','Active',NULL,NULL,'','2026-05-07 07:17:16',NULL,'HBCHH62','','DELL','Ram DDR4 8GB, CPU Intel Core i5-6500, HDD 1TB.','Cancer Center'),
('96443ce1-af6e-4981-82b1-7a997608af4f','K3PH000005','Peripheral','Sakal Polyclinic Street 2004','EPSON L6170','Active',NULL,NULL,'','2026-05-07 09:10:53',NULL,'X4EY036458','','Epson','','BILLING COUNTER'),
('965cc9fc-fff8-4be8-a9c9-3e7223dfe4a3','K2OE000004','Peripheral','KHEMA Polyclinic','L3110','Active',NULL,NULL,'','2026-05-07 07:17:17',NULL,'','','EPSON','','Nurse Station'),
('96e7b983-4152-4f7b-85ee-a646b550860e','K1PH000102','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','12th Gen Intel Core i5-12500T,Serial 5C595S3','Dell','Dell Optiplex 5400 AIO','Pharmacy Room'),
('9739a47f-cc18-4740-af2a-ff6c0c7f7ba3','KGPS000001','Softwares','KHEMA GLOBAL CO.,LTD','','Active',NULL,NULL,'','2026-05-07 07:45:43',NULL,'','','Microsoft','Microsoft Dynamic 365 - Accounting Software','FIN'),
('97fa80aa-37ed-4e12-8a18-f02ef4f2f4c7','K1PH000093','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','K1P3 CT Scan Room, Serial: 8X18ZH3','Dell','Dell Optiplex 5490 AIO Core i5-11500T 8GB (All in One)','K1P3 CT Scan Room'),
('98035706-ecac-44aa-8223-90faacac06a4','K1PH000083','Peripheral','KHEMA Hospital Toul Kork','UPS Power Supplie trupower ','Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','SEMI ICU','trupower ','UPS Power Supplie trupower ','K1FGRICU'),
('9853080f-5620-412f-a68e-cf6f9e2d91ee','K1PH000107','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:01',NULL,'','Nurse Station PC 1','Dell','Desktop Dell Optiplex AIO Plus 7410','Nurse station 1F'),
('98ca011c-4e15-489e-b643-e99b284f05cf','K2PH000021','Computer','KHEMA Polyclinic','Optiplex3240','Active',NULL,NULL,'','2026-05-07 07:17:16',NULL,'GMQZT72','','DELL','Ram DDR4 8GB, CPU Intel Core i3-6100, HDD 1TB.','Nurse Station'),
('99a58774-5fdf-4573-afca-b72ae10744b4','K2PH000046','Computer','KHEMA Polyclinic','OptiPlex 5250 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:12',NULL,'66CWZL2','','DELL','Ram DDR4 8GB, CPU Intel Core i3-7100, HDD 500GB','Pharmacy center'),
('9a94f268-7ca8-44cb-8493-3cf952194a27','K2PH000058','Computer','KHEMA Polyclinic','OptiPlex 5270 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:12',NULL,'8SLCRZ2','','DELL','Ram DDR4 8GB, CPU Intel Core i5-9500, HDD 500GB','Billing front left'),
('9d6c4778-d909-46d7-ac0d-3d3fe99e41dc','K1PH000006','Computer','KHEMA Hospital Toul Kork','Dell OptiPlex 5250 AIO','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','Dell Optiplex 5250 AIO Intel Core i5-7500 CPU @ 3.40GHz, Serial F1MMRK2','Dell','Computer -Mouse(1) -keyboards(1)','K12FRHemo'),
('9d824634-79ac-433d-a640-ce3ab379e11e','K1PH000110','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:01',NULL,'','13th Gen Intel Core i5-13500,Serial: GWW4324','Dell','Desktop Dell Optiplex AIO Plus 7410','Registation GF'),
('9ed32333-b882-4be4-8ae6-a8158b7f33b6','K2PH000086','Computer','KHEMA Polyclinic','OptiPlex 5490 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:14',NULL,'HVQNRH3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-11500T(6 cores), SSD 500GB.','PhnomPenh'),
('9fad4590-4d0d-40f9-9eae-72cec53bf916','K1PH000066','Computer','KHEMA Hospital Toul Kork','Computer Dell AIO 3280 (New ER)','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','Serial: 4FHXB33 Pediatrics Urgent Room','Dell','Computer Dell+Mouse+Keyboard -1Set','K1P3 Pediatrics Urgent Room'),
('a2e38f14-8914-4705-a547-43fb02439793','K2PH000001','Computer','KHEMA Polyclinic','OptiPlex 7020 Tower','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'GWPF862','','DELL','Ram DDR4 4GB, CPU Intel Core i3-4160, HDD 1TB','Laboratory R server'),
('a4b20d55-6b48-4229-8283-8d0211db86d8','K1PH000076','Computer','KHEMA Hospital Toul Kork','Dell all in One Optiplex 3280 ','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','Used By General Manager, Intel Core i5-10500T CPU @ 2.30GHz, Serial: 3V18ZH3','Dell','Dell all in One Optiplex 3280 ','Administration Office'),
('a6cc3700-6221-4634-bc68-eaad84ca5619','K1PH000096','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','Nurse Station PC3','Dell','Dell Optiplex 5400 All-in-One','Nurse Station 1F'),
('a6de1fb6-d128-4015-92de-0a22a8fcdd89','K2PH000085','Computer','KHEMA Polyclinic','Dell Optiplex 5490 AIO','Active',NULL,NULL,'','2026-05-07 07:17:14',NULL,'CVQNRH3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-12500T(6 cores), SSD 256GB.','London Room'),
('a85e554b-5a2b-49d1-b3c1-f1e5c9e1634f','K2PH000053','Computer','KHEMA Polyclinic','Optiplex3240','Active',NULL,NULL,'','2026-05-07 07:17:16',NULL,'GMR6V72','','DELL','Ram DDR4 8GB, CPU Intel Core i3-6100, HDD 500GB.','Desneyland'),
('aa196813-512f-4a51-93a3-99d40d8ef354','K2PH000007','Computer','KHEMA Polyclinic','OptiPlex 3240 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'GMQX992','','DELL','Ram DDR4 8GB, CPU Intel Core i3-6100, HDD 500GB.','Nurse Station'),
('aa6fe63b-e119-4a3c-9f0b-6dabeef3b815','K2PH000009','Computer','KHEMA Polyclinic','OptiPlex 5250 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'667RZL2','','DELL','Ram DDR4 8GB, CPU Intel Core i3-7100, HDD 500GB','Doctor Lounge R'),
('aa7470a9-dec6-4377-9c55-336f6eb08d70','KGPH000003','Laptop','KHEMA GLOBAL CO.,LTD','','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','Uesd Bong Sphorn','Dell','Laptop Dell Latitude 5420 Core I7-1165G7 & Screen Monitor','ADM'),
('ab04ae5a-000d-4de3-ad43-7921e15c2217','K3OE000006','CCTV','Sakal Polyclinic Street 2004','CS-C3W-A0-3H4WFRL','Active',NULL,NULL,'','2026-05-07 09:10:53',NULL,'','Sent to K1','Eviz','','K1'),
('ad34f90d-e6bf-456b-beb6-0d8c1abc7340','K3OE000013','CCTV','Sakal Polyclinic Street 2004','CS-C3W-A0-3H4WFRL','Active',NULL,NULL,'','2026-05-07 09:10:54',NULL,'','office','Eviz','','Admin Office'),
('add5b636-2cb7-4f74-b241-87bf34d46c5f','K2OE000010','Peripheral','KHEMA Polyclinic','Logitech','Active',NULL,NULL,'','2026-05-07 07:21:12',NULL,'','','Logitech','Logitech Group  HD Video Audio Conference','Meeting Room'),
('afbed313-5a74-4a59-bf5e-3be59925f564','K2PH000094','Computer','KHEMA Polyclinic','OptiPlex 5400','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'5LZWZQ3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-12500T(6 cores), SSD 256GB.','PC Supervisor'),
('b0af22aa-2025-413b-8527-c143efacfd38','K3OE000004','Peripheral','Sakal Polyclinic Street 2004','EPSON L805','Active',NULL,NULL,'','2026-05-07 09:10:52',NULL,'W7ZK099431','','Epson','','ECHO ROOM '),
('b1a52772-b431-41c5-b60e-a7bb6c67b988','K2PH000083','Computer','KHEMA Polyclinic','OptiPlex 5490 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:13',NULL,'GWQNRH3','','DELL','Ram 8GB, CPU Intel Core i5-11500T, SSD 500GB','Customer Service'),
('b264049f-419f-44a2-8954-bcbf2926779c','KGPH000002','Laptop','KHEMA GLOBAL CO.,LTD','','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','Used Bong Nara,Serial: 3SK3RG3','Dell','Latop Dell Latitude 3420 & Screen Monitor','FIN'),
('b3b4ae2d-fcd9-448c-8bc6-424d569cc2c5','K1FF000051','Peripheral','KHEMA Hospital Toul Kork','LG 55\" UHD 4K Smart CTV','Active',NULL,NULL,'','2026-05-07 04:51:04',NULL,'','Ground Floor Patient Lounge K1P4','LG','LG 55\" UHD 4K Smart CTV','Ground Floor Patient Lounge K1P4'),
('b8af354e-7aef-4ef5-a770-8534ab8ef467','KGPH000001','Laptop','KHEMA GLOBAL CO.,LTD','','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','Keep IT-Officer,Serial: HNK3RG3','Dell','Latop Dell Latitude 3420 & Screen Monitor','Server Room'),
('ba13f1e5-d77a-445d-a581-19cda575f4dd','K1PH000109','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:01',NULL,'','13th Gen Intel Core i5-13500,Serial: 3XW4324','Dell','Desktop Dell Optiplex AIO Plus 7410','Cashier GF'),
('bd61bc28-5424-4c77-b177-1e6bba6c99e1','K1PH000056','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','Used By Admin Officer, Intel Core i5-9500 CPU @ 3.00GHz, Serial: 2VJXV23','Dell','Computer Desktop Brand Dell Optiplex 5070 MT -Dell','Administration Office'),
('be168c20-4f20-4919-abaf-4b74013a7622','K1PH000054','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','Keeping K1P4 Server room','Dell','Dell Optiplex 5060MT Core i5-8500 4GB (1*4GB) DDR4 1TB 3.5\'\' ','K1P4 Server room'),
('c2f5e0b4-e365-4a67-b480-ffc07af43f22','K3PH000004','Peripheral','Sakal Polyclinic Street 2004','EPSON L6170','Active',NULL,NULL,'','2026-05-07 09:10:53',NULL,'X4EY035409','','Epson','','NURSE COUNTER Floor 4'),
('c337f5a7-0417-4421-8410-abc052a471d5','KGPH000009','Computer','KHEMA GLOBAL CO.,LTD','Dell Optlplex 7410 AIO','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','Accounting (Kunnaroth),Serial: 8CM6414','Dell','Dell Optlplex 7410 AIO','Accounting (Kunnaroth)'),
('c78d5069-db6f-4079-a137-7cfa4260201a','K1PH000106','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:01',NULL,'','Nurse Station PC 2','Dell','Desktop Dell Optiplex AIO Plus 7410','Nurse station 1F'),
('c7fd3e60-896a-429e-a8c4-678acb74db7e','K2PH000014','Computer','KHEMA Polyclinic','OptiPlex 5250 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:12',NULL,'5MB0QM2','','DELL','Ram DDR4 16GB, CPU Intel Core i5-7500, HDD 500GB','Billing front right'),
('c940a6f3-c609-4978-ae89-01477b45b880','K1PH000104','Network','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:01',NULL,'','K1P4 Server room (Used in Server Rack)','MikroTik','MikroTik RouterBoard 1100x4','K1P4 Server room'),
('cd48891f-611d-4bf1-af6b-e52f7b18bcf9','K2PH000003','Computer','KHEMA Polyclinic','OptiPlax 5250','Active',NULL,NULL,'','2026-05-07 07:17:16',NULL,'D77P7N2','','DELL','Ram DDR4 8GB, CPU Intel Core i3-7100, HDD 500GB.','Cath Lab'),
('cedba394-180a-4c23-90be-4f143f5fe0cd','K1PH000098','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','Dell OptiPlex 3070 Intel Core i3-9100 CPU @ 3.60GHz, Serial: 7VXYV23 (Label on Monitor),Device Name DESKTOP-13DI7G3','Dell','Back dest PC','K1 Laboratory Room'),
('cf07e56f-5bf0-4936-9c05-fa44dd9a99ec','K1PH000003','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','Dell OptiPlex 7020 Intel Core i5-4590 CPU @ 3.30GHz, Serial: 5MM9R42, Device Name, DESKTOP-SHH7CUE','Dell','Computer -mouse(1) +keyboards(1) -Boards Computer(1) -CPU(1)','K1 Laboratory Room'),
('cf503a35-8631-42f3-825e-6d742aef7757','K3PH000014','Computer','Sakal Polyclinic Street 2004','Dell AIO','Active',NULL,NULL,'','2026-05-07 09:10:50',NULL,'','','Dell','','K3F2-Nurse'),
('cf72013d-788a-4268-8cd9-14770dd207f5','K2PH000034','Computer','KHEMA Polyclinic','OptiPlex 3240 All-in-One','Active',NULL,NULL,'','2026-05-07 07:17:12',NULL,'HB8GH62','','DELL','Ram DDR4 8GB, CPU Intel Core i5-6500, HDD 1TB.','Pharmacy right'),
('d05a2232-36b5-4482-bbce-07b5c2df62cc','K1PH000117','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:02',NULL,'','13th Gen Intel Core i5-13500,Serial: 4WW4324','Dell','Desktop Dell Optiplex AIO Plus 7410','EEG & EKG Room GF'),
('d060f5cd-4c69-477f-b784-b472f2b777f2','K1PH000075','Computer','KHEMA Hospital Toul Kork','Dell all in One Optiplex 3280 ','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','Uesd by Mr.KHUT Somphors, Dell Optiplex 3280 AIO, Intel Core i5-10500T CPU @ 2.30GHz, Serial DXCVG53','Dell','Dell all in One Optiplex 3280 ','Medical Stock'),
('d0652a9f-2b5f-4590-b4fb-b39c283b4bab','K2PH000093','Computer','KHEMA Polyclinic','OptiPlex 5400 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:14',NULL,'GHZWZQ3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-12500T(6 cores), SSD 256GB.','Pediatrics'),
('d3e37e15-eda4-41d5-a6d5-b4213b378133','K1PH000112','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:01',NULL,'','13th Gen Intel Core i5-13500, Serial: BWW4324','Dell','Desktop Dell Optiplex AIO Plus 7410','OPD NURSE STATION PC2'),
('d4f9ad09-df3f-474c-bdd8-ff85b87991c8','K2PH000082','Computer','KHEMA Polyclinic',NULL,'Active',NULL,NULL,'','2026-05-07 07:17:16',NULL,'','','DELL','Ram DDR4 8GB, CPU Intel Core i3-6100, HDD 1TB.','Admin Officer'),
('d5052d98-de53-4e17-968f-1c521a3cf779','K2PH000029','Computer','KHEMA Polyclinic','Optiplex3240','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'HBC4V72','','DELL','Ram DDR4 8GB, CPU Intel Core i3-6100, HDD 1TB.','Nurse Station'),
('d6e2fe3e-94e9-473b-86a7-510694e8c500','K3PH000011','Laptop','Sakal Polyclinic Street 2004','Dell Latitude 3280 AIO','Active',NULL,NULL,'','2026-05-07 09:10:50',NULL,'','','Dell','','K3F1-Xray'),
('d7ce6c68-fa8c-403c-b9fc-4efa5e1ea909','K1PH000108','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:01',NULL,'','General Consultation - Ultrasound GF','Dell','Desktop Dell Optiplex AIO Plus 7410','General Consultation - Ultrasound GF'),
('da067572-0f95-40e5-9f8d-4009e76758ee','K1PH000039','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','Dell Optiplex 3280 AIO Intel Core i5-10500T CPU @ 2.30GHz , Serial HFHXB33','Dell','Computer -mouse(1) +keyboards(1)   ','Nurse station 3F'),
('df07e4cb-d647-42ad-a0d5-87ae7bc2adab','KGPH000014','Laptop','Sakal Polyclinic Street 2004','Lenovo ThinkPad E16','Active',NULL,NULL,'','2026-05-07 07:45:43',NULL,'','','Dell','','Junior IT Laptop'),
('dfbb8949-aad8-411f-a94b-a3249fea67a4','K3PH000025','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 5480 AIO','Active',NULL,NULL,'','2026-05-07 09:10:50',NULL,'DZPPG53','','Dell','','Okide Room'),
('dfd1e1e1-3adb-4425-b295-9673ffa9628b','K1PH000080','Computer','KHEMA Hospital Toul Kork','Dell all in one Optitlex 3280','Active',NULL,NULL,'','2026-05-07 04:50:59',NULL,'','Intel Core i5-10500T CPU @ 2.30GHz, Serial: 4V18ZH3','Dell','Dell all in one Optitlex 3280','K1FGRICU'),
('e02d9301-7737-493d-9181-c1f528dd4805','K2PH000025','Computer','KHEMA Polyclinic','OptiPlex 5250 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:15',NULL,'GMR1V72','','DELL','Ram DDR4 8GB, CPU Intel Core i3-6100, HDD 500GB.','GM'),
('e0725333-0907-47a7-8306-82fcb43fb72d','K1PH000091','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','Used by Mis.NEOU Sotharoath, Dell OptiPlex 5490 AIO, 11th Gen Intel Core i5-11500T @ 1.50GHz, Serail 1KSGWH3','Dell','Dell Optiplex 5490 AIO Core i5-11500T 8GB (Desktop all in one)','Medical Stock'),
('e4205286-bb04-4857-aaea-c60247afc3a7','K1OE000007','Peripheral','KHEMA Hospital Toul Kork','K1P1-Phone System Extension PABX','Active',NULL,NULL,'','2026-05-07 04:51:03',NULL,'','','Panasonic','K1P1-Phone System Extension PABX','K1P3 Server room'),
('e520ee5c-6c39-4130-8c39-d0253acb4075','K1PH000100','Peripheral','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','Used K1P4 OR Room','Power T','Power T UPS 10KVA/9000W16*12V.2AH','K1P4 OR Room'),
('e5a6b75e-63f3-4e99-b0de-8f51c20268a1','K1PH000041','Computer','KHEMA Hospital Toul Kork','Dell All In One OptiPlex 5250 AIO','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','2F Nurse Station PC 2','Dell','Computer -mouse(1) +keyboards(1)   ','Nurse Station 2F'),
('e5cb5165-dc33-4ba1-8f51-b725f3d1a9a0','KGPH000015','Laptop','KHEMA GLOBAL CO.,LTD','Laptop Lenovo Thinkpad E16','Active',NULL,NULL,'','2026-05-07 07:45:43',NULL,'','Insurance (Mrs. Dany Rous)','Lenovo','Laptop Lenovo Thinkpad E16','Insurance & Corporate Partnership Manager-Dany Rou'),
('e5df5517-449c-4f0c-baf8-d6ab602a041d','KGPH000016','Computer','KHEMA GLOBAL CO.,LTD','Dell Optlplex 7410 AIO','Active',NULL,NULL,'','2026-05-07 07:45:43',NULL,'','Uesd Nurse','Dell','Dell Optlplex 7410 AIO','K1P3 Nurse Station'),
('e62c9bef-3eb9-49f5-a185-3e57db612ed0','KGPH000007','Laptop','KHEMA GLOBAL CO.,LTD','Laptop Cyborg 15 A12VF','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','Legarden office-Head HR ','asus','Laptop Cyborg 15 A12VF','Legarden office-Head HR '),
('e7e0b3fe-e94c-4373-ade7-fe913d9235b1','K3PH000046','Laptop','Sakal Polyclinic Street 2004','Dell Latitude 5410 BTX Base','Active',NULL,NULL,'','2026-05-07 09:10:52',NULL,'','','Dell','','Sakal AR'),
('e91306f5-0dd7-4952-a514-09f170d63415','K1PH000092','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:00',NULL,'','K1P3 CT Scan Room,Serial: 33WSXP3','Dell','Dell Optiplex 5490 AIO Core i5-11500T 8GB (All in One)','K1P3 CT Scan Room'),
('e9596f76-42f5-459c-8379-274eb0c76e78','K3PH000015','Computer','Sakal Polyclinic Street 2004','Dell AIO','Active',NULL,NULL,'','2026-05-07 09:10:50',NULL,'','','Dell','','K2F1-Pharmacy1'),
('e996203f-f85e-4cd6-acdf-effe05a12f40','K2PH000020','Computer','KHEMA Polyclinic','OptiPlex 3240 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:14',NULL,'GMR3H82','','DELL','Ram 8GB, CPU Intel Core i3-12500T, HDD 500GB','Singapore'),
('e9e43b92-4e46-4d0e-87bd-b072d8df4e4e','K1PH000048','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','K1P4 Servcer Room Keeping','Motile ','Brand Motile 5060 Min Towe-Intel core i5-8500 ','K1P4 Servcer Room'),
('ee5b3ea1-9d60-4e2b-a311-dbd9df898743','K1PH000073','Computer','KHEMA Hospital Toul Kork','Dell all in One Optiplex 3280 ','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','Keeping in K1P4 Server room (Plan Disposal)(S)','Dell','Dell all in One Optiplex 3280 ','K1P4 Server room'),
('ee6dda5c-fb2b-45bd-b816-dcd43ce3fa8f','K2PH000104','Computer','KHEMA Polyclinic','OptiPlex 5400','Active',NULL,NULL,'','2026-05-07 07:17:16',NULL,'8F595S3','','DELL',' Ram DDR4 16GB Upgraded, CPU Intel Core i5-12000T, SSD 250GB.','Marketing Room'),
('eef0d69c-d5bf-4b9f-a0ee-d45b4fd83159','K3OE000009','CCTV','Sakal Polyclinic Street 2004','CS-C3W-A0-3H4WFRL','Active',NULL,NULL,'','2026-05-07 09:10:53',NULL,'','','Eviz','','Stock F4'),
('efdf9b57-9ff4-4243-a32d-54b9702e8d52','KGOE000001','Peripheral','KHEMA GLOBAL CO.,LTD','','Active',NULL,NULL,'','2026-05-07 07:45:42',NULL,'','','LG','Air Conditioner K1P3 Meeting room','K1P3 Meeting Room'),
('f040a9b5-58ea-4216-87cf-8c3650a6c7a8','K3PH000016','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 3280 AIO','Active',NULL,NULL,'','2026-05-07 09:10:50',NULL,'','','Dell','','Dr.Sopheap Room'),
('f1e7eb4a-4388-42d5-9249-30d69769e19a','K2PH000062','Computer','KHEMA Polyclinic','OptiPlex 5270 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:12',NULL,'8SFJRZ2','','DELL','Ram DDR4 8GB, CPU Intel Core i5-9500, SSD 500GB','Doctor Lounge L'),
('f27a740a-f210-415c-b3d7-bf56d9e5fff3','K1FF000050','Peripheral','KHEMA Hospital Toul Kork','LG 55\" UHD 4K Smart CTV','Active',NULL,NULL,'','2026-05-07 04:51:03',NULL,'','Ground Floor Patient Lounge K1P4','LG','LG 55\" UHD 4K Smart CTV','Ground Floor Patient Lounge K1P4'),
('f385919c-b4a7-46df-aa1f-a1e15412df46','K1PH000071','Computer','KHEMA Hospital Toul Kork','Dell all in One Optiplex 3280 ','Active',NULL,NULL,'','2026-05-07 04:50:58',NULL,'','1F ICU Nurse Station, Dell OptiPlex 3280 AIO Intel Core i5-10500T CPU @ 2.30GHz, Serial: CW18ZH3 ','Dell','Dell all in One Optiplex 3280 ','K1F2RICU'),
('f51a258d-c8d2-4203-bac9-1ac7c096e829','K3PH000019','Computer','Sakal Polyclinic Street 2004','Dell Optiplex 3280 AIO','Active',NULL,NULL,'','2026-05-07 09:10:49',NULL,'DZQRG53','Customer Service Counter','Dell','','K3GF-REGISTER'),
('f5b25a0b-833d-446c-921b-856c24addcb6','K2PH000067','Laptop','Sakal Polyclinic Street 2004','Asus vivobook-E406MA-BV090T Blue&White','Active',NULL,NULL,'','2026-05-07 09:10:52',NULL,'','','Asus','','Home Care K3'),
('f67a88df-1280-42d5-bc71-47a1864bc982','K2PH000100','Computer','KHEMA Polyclinic','OptiPlex 5400 All-In-One','Active',NULL,NULL,'','2026-05-07 07:17:12',NULL,'2D595S3','','DELL','Ram DDR4 8GB, CPU Intel Core i5-12500T(6 cores), M2 256GB.','CT-Scan'),
('f78418ac-e353-404f-b8c2-f492a13afe7c','K2FF000002','Peripheral','KHEMA Polyclinic','LG TV','Active',NULL,NULL,'','2026-05-07 07:17:17',NULL,'711INCN5L451','','LG','43LJ500T Monitoring Camera Security','Server'),
('f8920fa9-c417-4194-8156-68def9f9adba','K1PH000005','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','Keeping in K1P4 Server room (Plan Disposal)(S) OptiPlex 5250 AIO','Dell','Computer -Mouse(1) -keyboards(1)','K1P4 Server room'),
('f90275f1-474d-4340-ae4f-f908d0a09428','K3OE000003','Peripheral','Sakal Polyclinic Street 2004','EPSON L805','Active',NULL,NULL,'','2026-05-07 09:10:53',NULL,'W7ZK101479','','Epson','','Stock F4'),
('fbb8425f-4357-490b-9b28-e4a0b6bcd600','K2PH000027','Computer','KHEMA Polyclinic','OptiPlex 3046 Tower','Active',NULL,NULL,'','2026-05-07 07:17:14',NULL,'DCM6VG2','','DELL','Ram DDR4 8GB, CPU Intel Core i5-6100, HDD 500GB','Stock Controller'),
('fc5cc7c1-84fb-44d4-a2a2-4c7ce5ba5430','K1PH000007','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:56',NULL,'','K1P0GF/Doctor Room','Dell','Computer -Mouse(1) -keyboards(1)','GF/Doctor Room'),
('fc5e0ef4-304e-4b53-b68b-276b2407c84d','K1PH000045','Computer','KHEMA Hospital Toul Kork','','Active',NULL,NULL,'','2026-05-07 04:50:57',NULL,'','','Dell','Computer Surface Pro ( Newest version) -Keyboards (Surface Pro Type Cover)','N/A'),
('ff4e3512-2999-477a-b0f2-8c9aeb941c5a','K1PH000113','Computer','KHEMA Hospital Toul Kork',NULL,'Active',NULL,NULL,'','2026-05-07 04:51:02',NULL,'','BLOOD SAMPLING - TREATMENT GF','Dell','Desktop Dell Optiplex AIO Plus 7410','BLOOD SAMPLING - TREATMENT GF');
/*!40000 ALTER TABLE `it_assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_cloud_categories`
--

DROP TABLE IF EXISTS `it_cloud_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_cloud_categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(50) DEFAULT 'indigo',
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_cloud_categories`
--

LOCK TABLES `it_cloud_categories` WRITE;
/*!40000 ALTER TABLE `it_cloud_categories` DISABLE KEYS */;
INSERT INTO `it_cloud_categories` VALUES
('0827cc80-b989-401a-ae06-3dcc2b6d2ef0','Database & Storage','Managed relational & NoSQL databases, object storage, and backups','teal',1,'2026-10-15 04:53:14'),
('137088b7-74e6-4904-9aa4-a305985a0e4f','AI & Machine Learning','LLM APIs, model training, speech recognition, and computer vision','purple',1,'2026-10-15 04:53:14'),
('276c7548-f776-470c-8019-5c52e399b7d2','Marketing & CRM','Customer relationship management, email automation, analytics pipelines','orange',1,'2026-10-15 04:53:14'),
('60fa20ea-5086-4456-8e3e-1b23914d92d2','Security & Compliance','WAF, firewalls, identity management (IAM), antivirus, and audit tools','rose',1,'2026-10-15 04:53:14'),
('626f83c7-0a1e-425c-8951-cdf5c4fbf998','Cloud Infrastructure','Compute (VMs), VPC networks, containers, and bare metal hosting','blue',1,'2026-10-15 04:53:14'),
('9c9f7e4f-d482-472a-a2f1-f801b62cdba2','Monitoring & Observability','APM tracing, log aggregation, uptime checks, and error metrics','amber',1,'2026-10-15 04:53:14'),
('ca87b663-cae2-4dc3-8cf6-6721c17a39db','Communication','Video conferencing, VoIP telephony, SMS gateways, and team chats','cyan',1,'2026-10-15 04:53:14'),
('ce95eb31-65a9-4a4b-8541-8486c883cc66','DevOps & CI/CD','Source control repositories, build pipelines, test runners, deployment tools','emerald',1,'2026-10-15 04:53:14'),
('d1958c5f-34a1-42ce-9807-6547b328bcb4','SaaS & Productivity','Office suites, collaboration tools, document editors, and business apps','indigo',1,'2026-10-15 04:53:14'),
('fe4d335e-3a31-4654-8f5e-58e3d6426191','Other','Miscellaneous unclassified cloud services and software toolings','slate',1,'2026-10-15 04:53:14');
/*!40000 ALTER TABLE `it_cloud_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_cloud_providers`
--

DROP TABLE IF EXISTS `it_cloud_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_cloud_providers` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `default_category` varchar(100) DEFAULT '',
  `website` varchar(255) DEFAULT '',
  `description` text DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_cloud_providers`
--

LOCK TABLES `it_cloud_providers` WRITE;
/*!40000 ALTER TABLE `it_cloud_providers` DISABLE KEYS */;
INSERT INTO `it_cloud_providers` VALUES
('0cbb3770-23c8-46d1-9993-059d80524962','Twilio','Communication','https://twilio.com','SMS notifications, WhatsApp business API, and telephony.',1,'2026-10-15 04:53:14'),
('0ce1d511-47d7-4a9a-b21b-2a3939506815','Datadog','Monitoring & Observability','https://datadoghq.com','Infrastructure monitoring, APM tracing, logs, and synthetic alerting.',1,'2026-10-15 04:53:14'),
('18ab39ff-f318-43a6-be9d-e751305b09f5','Cloudflare','Security & Compliance','https://cloudflare.com','WAF security, DDoS mitigation, DNS management, and CDN caching.',1,'2026-10-15 04:53:14'),
('310421d0-cabe-4834-b1b9-d3dc1029d672','GitHub','DevOps & CI/CD','https://github.com','Git source control, GitHub Actions CI/CD runners, and code security.',1,'2026-10-15 04:53:14'),
('3a185fd3-a08f-42fd-a544-8f347399e8f7','Figma','SaaS & Productivity','https://figma.com','UI/UX interface design, prototyping, and design systems.',1,'2026-10-15 04:53:14'),
('4ad2dcd6-4a8c-461f-b8ad-ab5e5e12090c','MongoDB Atlas','Database & Storage','https://mongodb.com','Fully managed cloud NoSQL database cluster.',1,'2026-10-15 04:53:14'),
('4d6b7435-e16f-4384-8018-7ea1f548ff35','Atlassian','DevOps & CI/CD','https://atlassian.com','Jira issue tracking, Confluence documentation, and Trello.',1,'2026-10-15 04:53:14'),
('4fae9d30-6321-480b-aadb-592b1bff9b06','Stripe','SaaS & Productivity','https://stripe.com','Payment processing gateway and subscription billing platform.',1,'2026-10-15 04:53:14'),
('6aebc06a-7aba-456b-9724-4489541ffbd1','Supabase','Database & Storage','https://supabase.com','Postgres backend, authentication, and realtime database.',1,'2026-10-15 04:53:14'),
('8e41ecd1-4a7a-490a-b32e-65b85e988f15','Google Cloud','Cloud Infrastructure','https://cloud.google.com','GCP compute, BigQuery data warehouse, Vertex AI, and Workspace.',1,'2026-10-15 04:53:14'),
('8f94a377-b396-4046-ac3e-5dfdac259f7a','OpenAI','AI & Machine Learning','https://openai.com','LLM generative AI APIs, ChatGPT team licenses, and embeddings.',1,'2026-10-15 04:53:14'),
('9f419c0a-e0cd-49a6-b4b1-a58ca9e38330','Other','Other','','Custom or unlisted cloud vendor / provider.',1,'2026-10-15 04:53:14'),
('a754f5d2-2b2a-456a-bb30-c8310420d02e','Oracle Cloud','Cloud Infrastructure','https://oracle.com/cloud','Oracle Cloud Infrastructure (OCI) and enterprise databases.',1,'2026-10-15 04:53:14'),
('a822079f-6bd2-4f57-a023-83a1b0f93c50','Slack','Communication','https://slack.com','Internal team collaboration, channels, and incident bridges.',1,'2026-10-15 04:53:14'),
('b7a50b97-ac5a-4876-b55f-d20fd17472f3','Amazon Web Services','Cloud Infrastructure','https://aws.amazon.com','Compute (EC2), Databases (RDS), Object Storage (S3), and VPC cloud infrastructure.',1,'2026-10-15 04:53:14'),
('c874eeae-e35e-4768-bdcc-b0b2f533e6fb','Microsoft','SaaS & Productivity','https://microsoft.com','Microsoft 365, Azure Cloud, Entra ID, Defender, and Windows enterprise.',1,'2026-10-15 04:53:14'),
('d29ba639-eac5-46d2-a090-c754dfe3828a','Zoom','Communication','https://zoom.us','Video conferencing, webinars, and telehealth communication.',1,'2026-10-15 04:53:14'),
('e4902491-b3be-4a15-ae5c-ae6b480d2c4c','Docker','DevOps & CI/CD','https://docker.com','Container runtime, Docker Hub repository, and image builds.',1,'2026-10-15 04:53:14'),
('ee57b8e5-4d6f-4d7c-8a87-df4c4fb694e5','Salesforce','Marketing & CRM','https://salesforce.com','CRM, sales pipeline, service cloud, and customer support.',1,'2026-10-15 04:53:14');
/*!40000 ALTER TABLE `it_cloud_providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_cloud_subscriptions`
--

DROP TABLE IF EXISTS `it_cloud_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_cloud_subscriptions` (
  `id` varchar(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `provider` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Cloud Infrastructure',
  `plan_tier` varchar(100) DEFAULT '',
  `billing_cycle` varchar(50) DEFAULT 'Monthly',
  `cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'USD',
  `seats_total` int(11) DEFAULT 0,
  `seats_used` int(11) DEFAULT 0,
  `status` varchar(50) DEFAULT 'Active',
  `renewal_date` date DEFAULT NULL,
  `auto_renew` tinyint(1) DEFAULT 1,
  `site_name` varchar(100) DEFAULT 'All Sites',
  `owner_team` varchar(100) DEFAULT 'IT Operations',
  `account_id` varchar(150) DEFAULT '',
  `payment_method` varchar(100) DEFAULT 'Credit Card',
  `portal_url` varchar(255) DEFAULT '',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_cloud_subscriptions`
--

LOCK TABLES `it_cloud_subscriptions` WRITE;
/*!40000 ALTER TABLE `it_cloud_subscriptions` DISABLE KEYS */;
INSERT INTO `it_cloud_subscriptions` VALUES 
('sub-radiant-01','RandiAnt Dicom Viewer','RadiAnt Dicom Viewer','RadiAnt Dicom Viewer','RadiAnt Dicom Viewer','Annually',236.36,'USD',6,6,'Active','2026-11-06',1,'KHEMA GLOBAL CO.,LTD','IT Operations','','Corporate Invoice','https://www.radiantviewer.com','DICOM Medical Image Viewer licenses for radiology and doctors','2026-10-15 00:00:00','2026-10-15 00:00:00'),
('sub-vcloudia-02','VPC Local Cloud Subscription','VCLOUDIA','Cloud Infrastructure','VPC Local Cloud','Annually',11684.40,'USD',1,0,'Active','2026-12-31',1,'KHEMA GLOBAL CO.,LTD','IT Operations','VCLOUD-KHEMA-01','Corporate Invoice','https://vcloudia.com','VPC Local Cloud Infrastructure for hospital systems and medical imaging','2026-10-15 00:00:00','2026-10-15 00:00:00'),
('sub-idrive-03','IDrive Cloud Storage Backup','Idrive','Database & Storage','Cloud Storage Backup','Annually',249.50,'USD',1,1,'Active','2027-02-18',1,'All Sites','IT Operations','IDRIVE-KHEMA','Credit Card','https://www.idrive.com','Off-site encrypted cloud backup for critical clinical records and database snapshots','2026-10-15 00:00:00','2026-10-15 00:00:00'),
('sub-cyfuture-04','16 VM Cloud Fix Plans - Business Basic USD','Cyfuture','Cloud Infrastructure','Business Basic USD (16 VM)','Annually',9293.00,'USD',16,16,'Active','2027-02-19',1,'Sakal Polyclinic Street 2004','IT Operations','CYF-16VM','Corporate Invoice','https://cyfuture.cloud','16 Virtual Machines hosting Sakal Polyclinic applications, database, and local servers','2026-10-15 00:00:00','2026-10-15 00:00:00'),
('sub-cyfuture-05','Extra Package - Monitering Services (SoftEther VPN)','Cyfuture','Cloud Infrastructure','Monitoring Services (SoftEther VPN)','Annually',160.00,'USD',1,1,'Active','2027-02-27',1,'Sakal Polyclinic Street 2004','IT Operations','CYF-VPN-MON','Corporate Invoice','https://cyfuture.cloud','SoftEther VPN site-to-site connectivity monitoring and security package','2026-10-15 00:00:00','2026-10-15 00:00:00'),
('sub-godaddy-06','6 Domain Registration (3Years)','Godaddy','Cloud Infrastructure','3Years Domain Registration','Annually',50.00,'USD',6,6,'Active','2027-03-05',1,'Sakal Polyclinic Street 2004','IT Operations','GD-DOMAINS','Credit Card','https://www.godaddy.com','Domain name registrations (3-year cycle, 6 active domains)','2026-10-15 00:00:00','2026-10-15 00:00:00'),
('sub-bluehost-07','khemahospital.com Domain +Domain Privacy + Protection','BlueHost','Cloud Infrastructure','Domain Privacy + Protection','Annually',37.19,'USD',1,1,'Active','2027-05-21',1,'KHEMA GLOBAL CO.,LTD','IT Operations','BH-KHEMA-DOM','Credit Card','https://www.bluehost.com','Primary hospital domain khemahospital.com with WHOIS privacy and domain security lock','2026-10-15 00:00:00','2026-10-15 00:00:00'),
('sub-cyfuture-08','2 VM New Anzer accounting systems Business Basic Plan','Cyfuture','Cloud Infrastructure','Business Basic Plan (2 VM)','Monthly',889.00,'USD',2,0,'Active','2027-06-23',1,'Sakal Polyclinic Street 2004','IT Operations','CYF-ANZER','Corporate Invoice','https://cyfuture.cloud','2 Virtual Machines hosting New Anzer hospital accounting and ERP systems','2026-10-15 00:00:00','2026-10-15 00:00:00'),
('sub-bluehost-09','WordPress Professional Hosting & Xcitium Backup Professional','BlueHost','Cloud Infrastructure','WordPress Professional Hosting','Annually',455.76,'USD',1,1,'Active','2027-07-01',1,'KHEMA GLOBAL CO.,LTD','IT Operations','BH-WP-HOST','Credit Card','https://www.bluehost.com','WordPress managed hosting for Khema Hospital website with Xcitium enterprise backup','2026-10-15 00:00:00','2026-10-15 00:00:00'),
('sub-godaddy-10','Web Hosting Ultimate Renewal + Daily Backups - 30 days','Godaddy','Cloud Infrastructure','Ultimate Renewal + Daily Backups','Annually',356.14,'USD',1,1,'Active','2027-08-26',1,'All Sites','IT Operations','GD-WEB-HOST','Credit Card','https://www.godaddy.com','Ultimate web hosting plan with 30-day automated rolling daily snapshots and backup protection','2026-10-15 00:00:00','2026-10-15 00:00:00');
/*!40000 ALTER TABLE `it_cloud_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_expenses`
--

DROP TABLE IF EXISTS `it_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_expenses` (
  `id` varchar(36) NOT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `actual_spend` decimal(10,2) DEFAULT NULL,
  `month` varchar(7) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_expenses`
--

LOCK TABLES `it_expenses` WRITE;
/*!40000 ALTER TABLE `it_expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `it_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_helpdesk`
--

DROP TABLE IF EXISTS `it_helpdesk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_helpdesk` (
  `id` varchar(36) NOT NULL,
  `helpdesk_id` varchar(50) DEFAULT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `assignee` varchar(100) DEFAULT NULL,
  `pending_count` int(11) DEFAULT NULL,
  `completed_count` int(11) DEFAULT NULL,
  `create_date_time` varchar(100) DEFAULT NULL,
  `period_from` date DEFAULT NULL,
  `period_to` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_helpdesk`
--

LOCK TABLES `it_helpdesk` WRITE;
/*!40000 ALTER TABLE `it_helpdesk` DISABLE KEYS */;
INSERT INTO `it_helpdesk` VALUES
('2274b5ad-898a-498d-8c68-95da832748c5','TEST-123','Site A','John Doe',5,2,'2026-05-05T04:52:13.458Z','2023-01-01','2023-01-31');
/*!40000 ALTER TABLE `it_helpdesk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_infrastructure`
--

DROP TABLE IF EXISTS `it_infrastructure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_infrastructure` (
  `id` varchar(36) NOT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `component` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `uptime_percentage` decimal(5,2) DEFAULT NULL,
  `risk_flag` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_infrastructure`
--

LOCK TABLES `it_infrastructure` WRITE;
/*!40000 ALTER TABLE `it_infrastructure` DISABLE KEYS */;
/*!40000 ALTER TABLE `it_infrastructure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_performance`
--

DROP TABLE IF EXISTS `it_performance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_performance` (
  `id` varchar(36) NOT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `employee_name` varchar(100) DEFAULT NULL,
  `kpi_name` varchar(100) DEFAULT NULL,
  `target` varchar(50) DEFAULT NULL,
  `actual` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_performance`
--

LOCK TABLES `it_performance` WRITE;
/*!40000 ALTER TABLE `it_performance` DISABLE KEYS */;
/*!40000 ALTER TABLE `it_performance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_sites`
--

DROP TABLE IF EXISTS `it_sites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_sites` (
  `id` varchar(36) NOT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_name` (`site_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_sites`
--

LOCK TABLES `it_sites` WRITE;
/*!40000 ALTER TABLE `it_sites` DISABLE KEYS */;
INSERT INTO `it_sites` VALUES
('1','KHEMA GLOBAL CO.,LTD','','Active'),
('2','KHEMA Hospital Toul Kork','KHEMA Hospital Toul Kork','Active'),
('3','KHEMA Polyclinic','','Active'),
('e7512074-7ee1-4ead-a875-2ecf0fc95966','Sakal Polyclinic Street 2004','','Active');
/*!40000 ALTER TABLE `it_sites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_staffing`
--

DROP TABLE IF EXISTS `it_staffing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_staffing` (
  `id` varchar(36) NOT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `employee_name` varchar(100) DEFAULT NULL,
  `role` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `performance_score` decimal(3,2) DEFAULT NULL,
  `monthly_schedule` varchar(255) DEFAULT NULL,
  `staff_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_staffing`
--

LOCK TABLES `it_staffing` WRITE;
/*!40000 ALTER TABLE `it_staffing` DISABLE KEYS */;
INSERT INTO `it_staffing` VALUES
('57fb45ba-0758-4ef0-939e-05389f0a1a4a','KHEMA Polyclinic','NY Chhunheang','IT Officer','Active',NULL,'KHEMA  Polyclinic','271-0797'),
('bddf7fe1-4334-440c-bf34-dab459e34e2a','KHEMA GLOBAL CO.,LTD','Chun Braseth','Head IT','Active',NULL,'KG Hospital, KHEMA  Polyclinic, KHEMA Hospital Toul Kork, Sakal Polyclinic Street 2004','217-0127'),
('c18718ce-fd1f-4185-9bf5-17403f175fcd','KHEMA Hospital Toul Kork','DA Phadenphorakden','IT Officer','Active',NULL,'KG Hospital, KHEMA Hospital Toul Kork','271-0157'),
('c2f71ac4-31bd-4acf-813b-825fb827ff1c','Sakal Polyclinic Street 2004','Mon Sopheab','Junior IT ','Active',NULL,'Sakal Polyclinic Street 2004','271-1122'),
('c64e1eec-d0d9-4e5c-8e07-057c3a4912fd','Sakal Polyclinic Street 2004','Ly Bunnarith','IT Officer','Active',NULL,'KG Hospital, Sakal Polyclinic Street 2004','371-0781');
/*!40000 ALTER TABLE `it_staffing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `it_training`
--

DROP TABLE IF EXISTS `it_training`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `it_training` (
  `id` varchar(36) NOT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `training_name` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `attendees_count` int(11) DEFAULT NULL,
  `completion_rate` decimal(5,2) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `it_training`
--

LOCK TABLES `it_training` WRITE;
/*!40000 ALTER TABLE `it_training` DISABLE KEYS */;
/*!40000 ALTER TABLE `it_training` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_templates`
--

DROP TABLE IF EXISTS `note_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_templates` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `title` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_templates`
--

LOCK TABLES `note_templates` WRITE;
/*!40000 ALTER TABLE `note_templates` DISABLE KEYS */;
INSERT INTO `note_templates` VALUES
('4dd101c2-5e40-4d65-ae8a-7c37c2101b31','657ac3f8-e200-4877-b2e3-e4da11fd9617','HMS Meeting','HMS Meeting','<h2>Meeting Details</h2>\n<ul>\n  <li><strong>Date & Time:</strong> [Date, Time]</li>\n  <li><strong>Location:</strong> [Location / Link]</li>\n  <li><strong>Attendees:</strong> [List names]</li>\n</ul>\n<br>\n<h2>1. Agenda</h2>\n<ul>\n  <li>[Agenda item 1]</li>\n  <li>[Agenda item 2]</li>\n</ul>\n<br>\n<h2>2. Discussion Notes</h2>\n<ul>\n  <li><strong>Topic 1:</strong> [Type notes here...]</li>\n  <li><strong>Topic 2:</strong> [Type notes here...]</li>\n</ul>\n<br>\n<h2>3. Key Decisions</h2>\n<ul>\n  <li>[Decision 1]</li>\n  <li>[Decision 2]</li>\n</ul>\n<br>\n<h2>4. Action Items</h2>\n<ul>\n  <li>[ ] [Action] - <strong>Owner:</strong> [Name] | <strong>Due:</strong> [Date]</li>\n  <li>[ ] [Action] - <strong>Owner:</strong> [Name] | <strong>Due:</strong> [Date]</li>\n</ul>\n<br>\n<h2>5. Next Meeting</h2>\n<ul>\n  <li><strong>Date & Time:</strong> [Next Meeting Date]</li>\n</ul>','2026-04-30 14:12:45'),
('6207b412-9bea-4b2b-aa20-ce51b6243041','657ac3f8-e200-4877-b2e3-e4da11fd9617','Call Meeting','for urgent Non Schedule call meeting','<h2>Meeting Details</h2>\n<ul>\n  <li><strong>Date & Time:</strong> [Date, Time]</li>\n  <li><strong>Location:</strong> [Location / Link]</li>\n  <li><strong>Attendees:</strong> [List names]</li>\n</ul>\n<br>\n<h2>1. Agenda</h2>\n<ul>\n  <li>[Agenda item 1]</li>\n  <li>[Agenda item 2]</li>\n</ul>\n<br>\n<h2>2. Discussion Notes</h2>\n<ul>\n  <li><strong>Topic 1:</strong> [Type notes here...]</li>\n  <li><strong>Topic 2:</strong> [Type notes here...]</li>\n</ul>\n<br>\n<h2>3. Key Decisions</h2>\n<ul>\n  <li>[Decision 1]</li>\n  <li>[Decision 2]</li>\n</ul>\n<br>\n<h2>4. Action Items</h2>\n<ul>\n  <li>[ ] [Action] - <strong>Owner:</strong> [Name] | <strong>Due:</strong> [Date]</li>\n  <li>[ ] [Action] - <strong>Owner:</strong> [Name] | <strong>Due:</strong> [Date]</li>\n</ul>\n<br>\n<h2>5. Next Meeting</h2>\n<ul>\n  <li><strong>Date & Time:</strong> [Next Meeting Date]</li>\n</ul>','2026-04-30 14:36:59'),
('9253a096-dcb3-43ff-b195-aee3d1611c4e','657ac3f8-e200-4877-b2e3-e4da11fd9617','Anzer Schedule Meeting','Anzer Schedule Meeting','<h2>Meeting Details</h2>\n<ul>\n  <li><strong>Date & Time:</strong> [Date, Time]</li>\n  <li><strong>Location:</strong> [Location / Link]</li>\n  <li><strong>Attendees:</strong> [List names]</li>\n</ul>\n<br>\n<h2>1. Agenda</h2>\n<ul>\n  <li>[Agenda item 1]</li>\n  <li>[Agenda item 2]</li>\n</ul>\n<br>\n<h2>2. Discussion Notes</h2>\n<ul>\n  <li><strong>Topic 1:</strong> [Type notes here...]</li>\n  <li><strong>Topic 2:</strong> [Type notes here...]</li>\n</ul>\n<br>\n<h2>3. Key Decisions</h2>\n<ul>\n  <li>[Decision 1]</li>\n  <li>[Decision 2]</li>\n</ul>\n<br>\n<h2>4. Action Items</h2>\n<ul>\n  <li>[ ] [Action] - <strong>Owner:</strong> [Name] | <strong>Due:</strong> [Date]</li>\n  <li>[ ] [Action] - <strong>Owner:</strong> [Name] | <strong>Due:</strong> [Date]</li>\n</ul>\n<br>\n<h2>5. Next Meeting</h2>\n<ul>\n  <li><strong>Date & Time:</strong> [Next Meeting Date]</li>\n</ul>','2026-05-19 01:35:25'),
('a014d30c-c360-4ebb-a501-653cc8f1e471','657ac3f8-e200-4877-b2e3-e4da11fd9617','D365BC_Integration Project_eHospital','D365BC_Integration Project_eHospital','<h2>Meeting Details</h2>\n<ul>\n  <li><strong>Date & Time:</strong> [Date, Time]</li>\n  <li><strong>Location:</strong> [Location / Link]</li>\n  <li><strong>Attendees:</strong> [List names]</li>\n</ul>\n<br>\n<h2>1. Agenda</h2>\n<ul>\n  <li>[Agenda item 1]</li>\n  <li>[Agenda item 2]</li>\n</ul>\n<br>\n<h2>2. Discussion Notes</h2>\n<ul>\n  <li><strong>Topic 1:</strong> [Type notes here...]</li>\n  <li><strong>Topic 2:</strong> [Type notes here...]</li>\n</ul>\n<br>\n<h2>3. Key Decisions</h2>\n<ul>\n  <li>[Decision 1]</li>\n  <li>[Decision 2]</li>\n</ul>\n<br>\n<h2>4. Action Items</h2>\n<ul>\n  <li>[ ] [Action] - <strong>Owner:</strong> [Name] | <strong>Due:</strong> [Date]</li>\n  <li>[ ] [Action] - <strong>Owner:</strong> [Name] | <strong>Due:</strong> [Date]</li>\n</ul>\n<br>\n<h2>5. Next Meeting</h2>\n<ul>\n  <li><strong>Date & Time:</strong> [Next Meeting Date]</li>\n</ul>','2026-05-19 07:02:05'),
('d37b79af-9188-48ad-9cec-a625b574a16f','657ac3f8-e200-4877-b2e3-e4da11fd9617','Digital Marketing ','Digital Marketing','','2026-07-09 06:45:11'),
('feb605bf-bf38-449f-aabb-4d1df5f70dc8','657ac3f8-e200-4877-b2e3-e4da11fd9617','Anzer Call Meeting','for all urgent call meeting discussion','<h2>Meeting Details</h2>\n<ul>\n  <li><strong>Date & Time:</strong> [Date, Time]</li>\n  <li><strong>Location:</strong> [Location / Link]</li>\n  <li><strong>Attendees:</strong> [List names]</li>\n</ul>\n<br>\n<h2>1. Agenda</h2>\n<ul>\n  <li>[Agenda item 1]</li>\n  <li>[Agenda item 2]</li>\n</ul>\n<br>\n<h2>2. Discussion Notes</h2>\n<ul>\n  <li><strong>Topic 1:</strong> [Type notes here...]</li>\n  <li><strong>Topic 2:</strong> [Type notes here...]</li>\n</ul>\n<br>\n<h2>3. Key Decisions</h2>\n<ul>\n  <li>[Decision 1]</li>\n  <li>[Decision 2]</li>\n</ul>\n<br>\n<h2>4. Action Items</h2>\n<ul>\n  <li>[ ] [Action] - <strong>Owner:</strong> [Name] | <strong>Due:</strong> [Date]</li>\n  <li>[ ] [Action] - <strong>Owner:</strong> [Name] | <strong>Due:</strong> [Date]</li>\n</ul>\n<br>\n<h2>5. Next Meeting</h2>\n<ul>\n  <li><strong>Date & Time:</strong> [Next Meeting Date]</li>\n</ul>','2026-05-11 08:34:50');
/*!40000 ALTER TABLE `note_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `thumbnail_url` varchar(1024) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `meeting_date` varchar(100) DEFAULT NULL,
  `agenda` text DEFAULT NULL,
  `meeting_venue` varchar(255) DEFAULT NULL,
  `telegram_alert_sent` tinyint(1) DEFAULT 0,
  `meeting_priority` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
INSERT INTO `notes` VALUES
('5482df91-6803-4aff-9e4d-d5445fe963af','657ac3f8-e200-4877-b2e3-e4da11fd9617','for all urgent call meeting discussion','<p>Dear Arial &amp; Laura,</p><p><br></p><p>I am writing to request a technical modification to our EMR system regarding the permissions for stopping and canceling orders. </p><p><br></p><p>We have identified an issue where EMR users are stopping orders that have already been processed into \"Hold\" invoices without authorization from the billing department. To ensure financial accuracy and maintain proper workflow controls, we require the following restrictions to be implemented:</p><p><br></p><p>1. **Restriction on Billed Items:** <strong>EMR users must be restricted from stopping any services or items that are already included in a \"Hold\" invoice. Once an item has reached the billing stage, the \"Stop\" or \"Cancel\" function should be disabled for standard EMR roles.</strong></p><p>2. **Billing Authorization<strong>:** Only users with designated Billing permissions should have the authority to cancel or reverse charges once an invoice has been generated.</strong></p><p>3. **New Order Flexibility:** <strong>EMR users should still retain the ability to add new items or services to a patient’s record. They should also be allowed to stop these new items before they are finalized or sent to billing.</strong></p><p><br></p><p>The goal of this update is to ensure that no billed charges are removed from the system without the direct involvement of the billing department.</p><p><br></p><p>Please review these requirements and provide an estimated timeline for the development and deployment of this update. We are available to discuss this further if you require additional technical specifications.</p><p><br></p><p>Best regards,</p><p><br></p><p><strong>Chun Braseth</strong></p><p><strong>Head IT</strong></p><p><br></p><p> Khema Global Co., Ltd</p><p> #18, St. 528, Sangkat Boeung Kok 1, Khan Toul Kok, </p><p>Phnom Penh, Cambodia. </p><p> Tel : (+855) 23 880 949, (+855) 89 924 033</p><p> Email : <a href=\"mailto:cbraseth@khemahospital.com\" target=\"_blank\">cbraseth@khemahospital.com</a></p><p>Website: <a href=\"http://www.khemahospital.com/\" target=\"_blank\">www.khemahospital.com</a></p>',NULL,'[]','[]','2026-05-11 09:46:34','2026-05-11 09:46:34',NULL,NULL,NULL,0,'Medium'),
('5c7e5a17-5d72-4c4b-bfb0-ba11fbfc57fc','657ac3f8-e200-4877-b2e3-e4da11fd9617','Anzer Schedule Meeting','<h2>Meeting Purpose</h2><p><span style=\"color: inherit;\">Review and prioritize a list of client enhancement requests.</span></p><h2>Key Takeaways</h2><ul><li><strong style=\"color: inherit;\">Top 5 Priorities:</strong><span style=\"color: inherit;\"> The client identified five critical items for immediate development:</span></li></ul><ol><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Billing Discount Display:</strong><span style=\"color: inherit;\"> Fix room charge invoices that show the final price but hide the discount, confusing corporate sponsors.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Hold Bill Logic:</strong><span style=\"color: inherit;\"> Disable the \"Stop\" button for items on a held bill to prevent unauthorized changes and enforce the billing workflow.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Procedure Package Inclusion:</strong><span style=\"color: inherit;\"> Create a mechanism to bundle services into a single procedure price, preventing individual items from being charged to the patient.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Patient Portal Smart Viewer:</strong><span style=\"color: inherit;\"> Enhance the portal with a modern, interactive viewer for lab results, including historical comparisons and B2B sharing.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">IPD Statement Grouping:</strong><span style=\"color: inherit;\"> Modify the IPD statement to group charges (e.g., all pharmacy items) into single lines for patient clarity.</span></li></ol><ul><li><strong style=\"color: inherit;\">DICOM Integration:</strong><span style=\"color: inherit;\"> The CT DICOM integration is broken and requires a fix. X-ray and ultrasound remain manual, but the client is open to user training to enable integration.</span></li><li><strong style=\"color: inherit;\">Queue Display:</strong><span style=\"color: inherit;\"> The queue display system only supports appointments. The client needs a solution for walk-in patients, potentially via a new registration type in the admin portal.</span></li><li><strong style=\"color: inherit;\">Member Card Printing:</strong><span style=\"color: inherit;\"> A new system for printing physical member cards is needed. The \"Data Card\" report can be repurposed as a temporary solution.</span></li></ul><h2>Topics</h2><h3>Billing &amp; Discounting</h3><ul><li><strong style=\"color: inherit;\">Room Charge Discount Display:</strong></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Problem:</strong><span style=\"color: inherit;\"> Invoices for room charges (added via AR screen) show the final price but hide the discount, confusing corporate sponsors.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Example:</strong><span style=\"color: inherit;\"> A $100 room charge with a 10% member discount appears as a $90 subtotal with no discount line item.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Solution:</strong><span style=\"color: inherit;\"> Anzer will investigate the CSR for this fix.</span></li><li><strong style=\"color: inherit;\">Procedure Package Inclusion:</strong></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Need:</strong><span style=\"color: inherit;\"> A way to bundle services into a single procedure price (e.g., $100 for a procedure) and prevent individual items from being charged to the patient.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Solution:</strong><span style=\"color: inherit;\"> Anzer\'s existing \"Package Inclusion\" CSR will meet this need. It allows EMR users to tag items as \"Package Inclusion,\" sending them to the relevant department (pharmacy, lab) but not to the AR screen for billing.</span></li><li><strong style=\"color: inherit;\">Bulk Discounting:</strong></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Need:</strong><span style=\"color: inherit;\"> A faster way for the AR team to apply discounts to multiple items at once.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Solution:</strong><span style=\"color: inherit;\"> Anzer has a CSR for bulk percentage discounts. The client requested adding support for bulk </span><em style=\"color: inherit;\">amount</em><span style=\"color: inherit;\"> discounts (e.g., \"$10 off each item\"), which Anzer will explore.</span></li><li><strong style=\"color: inherit;\">IPD Statement Grouping:</strong></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Need:</strong><span style=\"color: inherit;\"> A summary IPD statement for patients that groups charges by category (e.g., all pharmacy items on one line) instead of listing every transaction.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Solution:</strong><span style=\"color: inherit;\"> Anzer will modify the \"B4Medicare Care Extended\" report to support this grouping.</span></li></ul><h3>EMR &amp; Workflow</h3><ul><li><strong style=\"color: inherit;\">Hold Bill Logic:</strong></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Problem:</strong><span style=\"color: inherit;\"> The \"Stop\" button remains active for items on a held bill, allowing EMR users to make changes that disrupt the billing workflow.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Need:</strong><span style=\"color: inherit;\"> Disable the \"Stop\" button for items included in a held invoice.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Solution:</strong><span style=\"color: inherit;\"> This will be implemented as part of the \"Pha Pima Lok\" CSR, which is developing a new EMR clinical manager module.</span></li><li><strong style=\"color: inherit;\">Item Returns After Hold Bill:</strong></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Problem:</strong><span style=\"color: inherit;\"> Nurses can return items after a bill is held, which automatically deducts the item from the bill without notifying the billing team.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Need:</strong><span style=\"color: inherit;\"> Restrict returns post-hold bill or implement a notification/approval workflow for the billing team.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Solution:</strong><span style=\"color: inherit;\"> This requirement will also be addressed within the \"Pha Pima Lok\" CSR.</span></li><li><strong style=\"color: inherit;\">DICOM Integration:</strong></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Problem:</strong><span style=\"color: inherit;\"> The CT DICOM integration is broken. X-ray and ultrasound uploads are manual and time-consuming.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Need:</strong><span style=\"color: inherit;\"> Fix the CT integration and explore integration for X-ray and ultrasound.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Action:</strong><span style=\"color: inherit;\"> Daniel and PJ will work with Bunret to investigate and fix the CT issue.</span></li><li><strong style=\"color: inherit;\">Queue Display for Walk-ins:</strong></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Problem:</strong><span style=\"color: inherit;\"> The queue display system only shows patients with appointments, excluding walk-ins.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Need:</strong><span style=\"color: inherit;\"> A solution to include walk-in patients in the queue display.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Proposed Solution:</strong><span style=\"color: inherit;\"> Add a \"Walk-in\" registration type to the admin portal. Anzer will investigate this and other workarounds.</span></li></ul><h3>Patient Portal &amp; Lab</h3><ul><li><strong style=\"color: inherit;\">Patient Portal Smart Viewer:</strong></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Need:</strong><span style=\"color: inherit;\"> A modern, interactive report viewer for lab results in the patient portal.</span></li><li><strong style=\"color: inherit;\">Key Features:</strong></li><li class=\"ql-indent-2\"><strong style=\"color: inherit;\">Interactive View:</strong><span style=\"color: inherit;\"> Scrollable, zoomable, and fit-to-screen.</span></li><li class=\"ql-indent-2\"><strong style=\"color: inherit;\">Historical Comparison:</strong><span style=\"color: inherit;\"> View current results alongside previous visits.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">B2B Sharing:</strong><span style=\"color: inherit;\"> A direct share button for lab staff to send reports to external clinics.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Action:</strong><span style=\"color: inherit;\"> Junior will discuss these requirements with the development team.</span></li><li><strong style=\"color: inherit;\">Lab Test Result Ordering:</strong></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Need:</strong><span style=\"color: inherit;\"> The ability to reorder how lab test results appear on reports.</span></li><li class=\"ql-indent-1\"><strong style=\"color: inherit;\">Solution:</strong><span style=\"color: inherit;\"> This is configurable in the system. The client was shown how to use the \"Order\" field in the Laboratory module\'s \"Labos 3 ASAP\" screen to set the display order.</span></li></ul><h3>Member Card Printing</h3><ul><li><strong style=\"color: inherit;\">Need:</strong><span style=\"color: inherit;\"> A system to print physical member cards for patients at registration.</span></li><li><strong style=\"color: inherit;\">Solution:</strong><span style=\"color: inherit;\"> The existing \"Data Card\" report can be repurposed as a temporary solution. The client will provide a design specification for the new card format.</span></li></ul><h2>Next Steps</h2><ul><li><strong style=\"color: inherit;\">Sakal:</strong></li><li class=\"ql-indent-1\"><span style=\"color: inherit;\">Prioritize the full list of requests and send it to Anzer.</span></li><li class=\"ql-indent-1\"><span style=\"color: inherit;\">Send the design specification for the new member card.</span></li><li><strong style=\"color: inherit;\">Anzer:</strong></li><li><strong style=\"color: inherit;\">Investigate/Fix:</strong></li><li class=\"ql-indent-2\"><span style=\"color: inherit;\">Room charge discount display on invoices.</span></li><li class=\"ql-indent-1\"><span style=\"color: inherit;\">Broken CT DICOM integration (Daniel &amp; PJ with Bunret).</span></li><li><strong style=\"color: inherit;\">Develop (Top 5 Priorities):</strong></li><li class=\"ql-indent-2\"><span style=\"color: rgb(0, 190, 255);\">Hold bill logic &amp; return restrictions (within \"Pha Pima Lok\" CSR).</span></li><li class=\"ql-indent-2\"><span style=\"color: inherit;\">Procedure Package Inclusion feature.</span></li><li class=\"ql-indent-2\"><span style=\"color: inherit;\">Patient Portal Smart Viewer (Junior to discuss with dev team).</span></li><li class=\"ql-indent-1\"><span style=\"color: inherit;\">IPD statement grouping (modify \"B4Medicare Care Extended\" report).</span></li><li><strong style=\"color: inherit;\">Explore:</strong></li><li class=\"ql-indent-2\"><span style=\"color: inherit;\">Adding bulk </span><em style=\"color: inherit;\">amount</em><span style=\"color: inherit;\"> discounts to the existing CSR.</span></li><li class=\"ql-indent-1\"><span style=\"color: inherit;\">A solution for walk-in patients on the queue display.</span></li></ul><p><br></p>',NULL,'[]','[{\"name\":\"AnzerWorkLIST.xlsx\",\"size\":57861,\"type\":\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\",\"path\":\"/uploads/e7d9523fd78d1d32062b7e8a5310a765.xlsx\",\"id\":\"/uploads/e7d9523fd78d1d32062b7e8a5310a765.xlsx\"}]','2026-05-19 01:57:32','2026-05-19 05:11:12',NULL,NULL,NULL,0,'Medium'),
('60227ecc-32d0-435d-87a9-af04300fef08','657ac3f8-e200-4877-b2e3-e4da11fd9617','Operation Meeting Notes - Head of IT','<p><strong>Meeting Details</strong></p><p>\n</p><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>Meeting Objective</strong></p><p>\n</p><p>Review IT operations status, ongoing issues, system performance, security matters, project updates, and immediate priorities.</p><p>\n</p><p><br></p><p>\n</p><p><strong>1. IT Operations Overview</strong></p><p>\n</p><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>2. Infrastructure &amp; Systems Status</strong></p><p>\n</p><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>3. Security &amp; Risk Update</strong></p><p>\n</p><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>4. Support &amp; Service Desk</strong></p><p>\n</p><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>5. Project &amp; Change Update</strong></p><p>\n</p><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>6. Key Issues / Challenges</strong></p><p>\n</p><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>7. Decisions Made</strong></p><p>\n</p><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>8. Action Items</strong></p><p>\n</p><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>9. Priorities Before Next Meeting</strong></p><p>\n</p><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>10. Head of IT Summary</strong></p><ul><li>Refresher HMS systems ( New staff mandatory, etc..) 1quater/1time</li><li><br></li></ul><p><br></p><p>\n</p><p><br></p><p>\n</p><p><strong>Next Meeting</strong></p><p>\n</p><p><br></p>',NULL,'[]','[]','2026-04-30 10:00:33','2026-05-08 03:40:01','2026-05-08T10:00','1- Monthly Reporting by Portfolios (NOTES: You need to report for January-April for this coming meeting)\n2- Upcoming Planned Activities\n3- AOB','KHEMA TK, KHEMA BKK & SAKAL',0,'Medium'),
('6cbf9130-54c5-45f5-8708-b208f4bcce18','657ac3f8-e200-4877-b2e3-e4da11fd9617','ABA Payways Integration ( aba & anzer technocal)','<p>Please find my feedback below. Kindly review and confirm if everything looks good from your side.</p><p><br></p><p><strong>1.</strong> The user sees a list of healthcare packages sold by Sakal Hospital.</p><p><strong>2. </strong>The user selects a package and views the detailed information for that package.</p><p><strong>3. </strong>The user taps “Buy Now”, which opens the checkout page showing pricing details, total amount, and other important instructions related to the package.</p><p><strong>4. </strong>The user taps “Pay Now” to start the payment process. This opens the ABA PayWay payment website inside our app using a WebView.</p><p><strong>5.</strong> After completing the payment on the ABA PayWay payment website, your system redirects back to our app, and we display either a payment success or payment failure page based on the payment status.</p>',NULL,'[]','[]','2026-06-12 04:17:47','2026-06-12 04:17:47',NULL,NULL,NULL,0,'Medium'),
('836ec036-9e46-4060-89ed-5e19ac727776','657ac3f8-e200-4877-b2e3-e4da11fd9617','D365BC_Integration Project_eHospital','<p>Discuss &amp; planning pending worklist for continue integration accounting systems with our accounting at 3rd floor K1P4 Meeting room.&nbsp;</p><p><br></p><ul><li>Packages &amp; non packages inventory stock</li><li>some of inclusion packages didn\'t show amount.</li></ul><p><br></p>',NULL,'[]','[]','2026-05-19 07:04:05','2026-05-19 08:09:19',NULL,NULL,NULL,0,'Medium'),
('d43ebc7f-29e8-4920-afc1-db5d6c077ec3','e80e05f5-d9e7-4d2d-95b9-f3fc217a6d2e','Test Note','Testing content',NULL,'[]','[]','2026-05-05 04:29:28','2026-05-05 04:29:28',NULL,NULL,NULL,0,NULL),
('d9ab5b8a-2602-4d24-801f-b5e72ce01be9','657ac3f8-e200-4877-b2e3-e4da11fd9617','Digital Marketing Web(SEO,SEM)','<p>Date : 09-07-2026</p><p>ProCare Marketing Solution : </p><p>Joined Member : Mr.Sophorn,Den,braseth</p>',NULL,'[]','[]','2026-07-09 06:47:50','2026-07-09 06:47:50',NULL,NULL,NULL,0,'Medium'),
('e0c7a177-4fd1-4cf3-ab7c-d8b51aaab9dc','657ac3f8-e200-4877-b2e3-e4da11fd9617','KHEMA IT Meeting Team','<p><strong>Meeting Title:</strong> KHEMA IT Meeting Team</p>\n<p><strong>Date and Time:</strong> </p>\n<p><strong>Attendees:</strong> </p>\n<br/>\n<p><strong>Purpose of Meeting:</strong></p>\n<p></p>\n<br/>\n<p><strong>Key Discussion Points:</strong></p>\n<ul>\n<li>Completed Items: </li>\n<li>In-Progress Items: </li>\n<li>Pending Items: </li>\n</ul>\n<br/>\n<p><strong>Decisions Made:</strong></p>\n<ul><li></li></ul>\n<br/>\n<p><strong>Risks / Issues Identified:</strong></p>\n<ul><li></li></ul>\n<br/>\n<p><strong>Action Items:</strong></p>\n<ul>\n<li>[Action] - [Owner] - [Due Date]</li>\n</ul>\n<br/>\n<p><strong>Executive Summary (Overall Status):</strong></p>\n<p></p>',NULL,'[]','[]','2026-04-30 09:19:30','2026-04-30 09:26:49','2026-05-04T09:00','1- Monthly task by site (NOTES: You need to presentation for Monthly progress for this coming meeting)\n2- Reports expense and inventory ( for presentation)\n3- Upcoming Planned Activities\n4- AOB','KHEMA Polyclinic Meeting Room',0,NULL),
('fd0ee3aa-0e73-451f-9bae-ffea8ec40bc8','1ffa7958-3cb0-4a17-bf4d-75a3506a9fe9','IT Notes & Meeting Minutes','<p>Cambodiare Blueventure</p><p>ASSURNET SOLUTIONS (CAMBODIA) CO LTD</p><p>Forte Insurance (Cambodia) Plc. (Figtree Blue)</p><p>SafetyNet Insurance Services (Cambodia) Co Ltd.</p>',NULL,'[]','[]','2026-06-01 03:17:59','2026-06-01 03:17:59',NULL,NULL,NULL,0,'Medium');
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `telegram_chat_id` varchar(255) DEFAULT NULL,
  `telegram_bot_token` varchar(255) DEFAULT NULL,
  `telegram_enabled` tinyint(1) DEFAULT 1,
  `telegram_alert_templates` text DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  `can_access_welcome` tinyint(1) DEFAULT 1,
  `can_access_it` tinyint(1) DEFAULT 0,
  `can_access_pro` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
('01afd587-df99-4d47-bc72-edbb7e2c5f52','test_foo_0.6313349539932416@test.com','$2b$10$FIPMRBXPh5nRXPA95MSzAOHv0Ue3Ihgvkerd.z7utgEjNghF7.mNe','Test',NULL,'2026-05-05 06:42:52',NULL,NULL,1,NULL,'user',1,0,0),
('047386ec-becd-4cea-b87f-0c520b939633','test_cloud_27529@ainotes.internal','$2b$10$GuSHJ8YShJ2ZaTb/rA2.H.wpoaq2Mqj9egkYNxA/pb/mNEwDzkEWK','IT Cloud Admin',NULL,'2026-10-15 04:14:13',NULL,NULL,1,NULL,'user',1,0,0),
('0b0f10ae-68a4-4073-9cd2-f0a92f1f6f77','test_count_0.13739047838011453@test.com','$2b$10$.ra7sZ4aVJYA5IkcAXTY9uLT0zh1aNZqIN64oMenJ/E7McFB1BDrS','Test',NULL,'2026-05-05 04:25:06',NULL,NULL,1,NULL,'user',1,0,0),
('19f22ee2-c0a6-41c0-908e-77e0ff961b7e','test_debug_0.11280152697840329@test.com','$2b$10$ZcT.JNeo/ftWult8.1Fg3uq5bJLqSgN/xCK/QlPoyFkTpT0hQcFRa','Debug',NULL,'2026-10-15 04:13:30',NULL,NULL,1,NULL,'user',1,0,0),
('1ffa7958-3cb0-4a17-bf4d-75a3506a9fe9','prorsethchun2014@gmail.com','$2b$10$86Hg7inHqb3XOYApNN.L9OMmMD1C6ils50GSJU3deQD0KaYWW7z6e','Flora & Fruita Official','Flora & Fruita','2026-04-22 11:16:21',NULL,NULL,1,NULL,'owner',1,1,1),
('4438daf6-e8f5-455b-afd7-abc02345777f','test_settings_24214@ainotes.internal','$2b$10$NJkgddi/WinaXc9OSpNJKO9QhF3nNMrykT/UoY1qAE0NdgQV3o3lC',NULL,NULL,'2026-10-15 04:53:14',NULL,NULL,1,NULL,'user',1,0,0),
('4db41d4c-e493-425b-9267-0e81a2828650','test_check_53830@ainotes.internal','$2b$10$POteyeIzwLJI5nTJDZPweuozUFVD/UFDsVM8r59568gIfn8JFzgw.','Test','Test','2026-10-15 04:36:06',NULL,NULL,1,NULL,'user',1,0,0),
('4f1cd437-4439-4e47-bbe4-5b8e3e344c4c','test_count_0.8301053005318157@test.com','$2b$10$xKFX2Hc9wNNwViT6UNIx5.HX18lLrw5s1WrfPGlqfJuJ3GytiB6Ce','Test',NULL,'2026-05-05 04:29:12',NULL,NULL,1,NULL,'user',1,0,0),
('54cceeb9-6bce-46aa-80dc-967acb5b3609','test_hd_0.6692746700554031@test.com','$2b$10$6DCP0GUyBHqzceOf8bwc9.fy4wqVYBWORJhcdGdWMKIdWn4Iq83um','Test',NULL,'2026-05-05 04:52:13',NULL,NULL,1,NULL,'owner',1,1,1),
('59150de9-cd1b-42d7-977c-69c249d21c46','test_hd_0.6650991562811654@test.com','$2b$10$PhL47kSvElxq9mLM0/CmYOreBP7.v4aTMR/MkbWU.T9zBA/gSwB3q','Test',NULL,'2026-05-05 04:54:08',NULL,NULL,1,NULL,'user',1,0,0),
('657ac3f8-e200-4877-b2e3-e4da11fd9617','prorseth@gmail.com','$2b$10$86Hg7inHqb3XOYApNN.L9OMmMD1C6ils50GSJU3deQD0KaYWW7z6e','Braseth Official','Braseth','2026-04-24 10:39:01','-1003928946011','8483750270:AAGQiYGO12V06X52e-I1uR-ulRj68O8AOcY',1,'[\"it-meeting\",\"ops-meeting\",\"6207b412-9bea-4b2b-aa20-ce51b6243041\",\"4dd101c2-5e40-4d65-ae8a-7c37c2101b31\",\"feb605bf-bf38-449f-aabb-4d1df5f70dc8\",\"9253a096-dcb3-43ff-b195-aee3d1611c4e\",\"a014d30c-c360-4ebb-a501-653cc8f1e471\",\"d37b79af-9188-48ad-9cec-a625b574a16f\"]','owner',1,1,1),
('90cf1c42-3078-4cfa-b948-0645082cf08a','test_del_0.14553010641619601@test.com','$2b$10$eQLWV/Gsl7QtwT..Sv57I.d62O24NMTT69yKpcT.cbpGbJxRKi8cy','Test',NULL,'2026-05-05 07:01:00',NULL,NULL,1,NULL,'user',1,0,0),
('ab088442-0a6a-42ad-a815-ee28bf5e2a87','test_cloud_83268@ainotes.internal','$2b$10$zzMBzoKaurdbtQ5QR/Pn0eRKa3gjYseRUYOu2MDSHKpCkbdoFgOJC','IT Cloud Admin',NULL,'2026-10-15 04:13:19',NULL,NULL,1,NULL,'user',1,0,0),
('cbf566ca-8968-4695-b030-95c8c13eac69','abc@gmail.com','$2b$10$Uxzu.uGwqJb78N/RarlCMeMMGr798yXakoCaF2lWUY8jiRzBkS7XS','test','test display','2026-04-22 10:55:24',NULL,NULL,1,NULL,'user',1,0,0),
('dd519437-3371-4452-8573-3299a34b7bd3','test_foo_0.4051595644214008@test.com','$2b$10$LCk0.n4S9o4LtGrOfCl.veaWnYUTLlD4db.Wb5TuQ.Ktf4G6t3xPa','Test',NULL,'2026-05-05 06:42:19',NULL,NULL,1,NULL,'user',1,0,0),
('e3cf7514-4c54-4576-9caf-da8202ddc57c','test_foo_0.5859132108983129@test.com','$2b$10$.xxAlLY3UlZAl1i8F1KHg.lvR2h4hd8KNj15s1ZfBDEbgQiINskqS','Test',NULL,'2026-05-05 04:54:34',NULL,NULL,1,NULL,'user',1,0,0),
('e80e05f5-d9e7-4d2d-95b9-f3fc217a6d2e','test_create_0.3439791332817561@test.com','$2b$10$jrhyxJKhXD.WVVFSQkrlS.lPZIw.7I0tkgiys2idj4EM8EWG85sa6','Test',NULL,'2026-05-05 04:29:28',NULL,NULL,1,NULL,'user',1,0,0),
('fea0e95f-a034-4b78-966f-6987bf840dd7','test_foo_0.03242125968930365@test.com','$2b$10$Ooo8Z8ic.A0dIC.5F3ARGeJT1Uzr7ELRgwoioVSj9Wh90YsfrUnum','Test',NULL,'2026-05-05 06:43:39',NULL,NULL,1,NULL,'user',1,0,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendors` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `cost` decimal(15,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `user_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `vendor_type` varchar(100) DEFAULT NULL,
  `vendor` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES
('494715d1-2f27-4775-841b-732859de86ec','Cisco Systems','Networking','David Miller','dmiller@cisco.com',NULL,'Active','657ac3f8-e200-4877-b2e3-e4da11fd9617','2026-10-15 03:59:17','Rental','Cisco'),
('5e15d8b0-44ef-49f6-8ea8-4670632dfda5','Amazon Web Services','Cloud Infrastructure','Alex Wong','aws-support@amazon.com',NULL,'Active','657ac3f8-e200-4877-b2e3-e4da11fd9617','2026-10-15 03:59:17','Subscription','AWS'),
('718774c3-24f7-45e9-b8f3-eb41c7f76150','Fortinet Security','Cybersecurity','Michael Ross','mross@fortinet.com',NULL,'Active','657ac3f8-e200-4877-b2e3-e4da11fd9617','2026-10-15 03:59:17','Device','Fortinet'),
('8aca2c1b-4295-47ac-af60-bf215129dc65','Microsoft Corporation','Software & Cloud','Sarah Jenkins','sjenkins@microsoft.com',NULL,'Active','657ac3f8-e200-4877-b2e3-e4da11fd9617','2026-10-15 03:59:17','Subscription','Microsoft'),
('9914c7c9-75f4-429c-a60a-f0071cd78cf1','Dell Technologies','Hardware','Robert Chen','r.chen@dell.com',NULL,'Active','657ac3f8-e200-4877-b2e3-e4da11fd9617','2026-10-15 03:59:17','Device','Dell');
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-15  4:53:17
