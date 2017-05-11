-- phpMyAdmin SQL Dump
-- version 4.3.11
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: May 11, 2017 at 03:42 PM
-- Server version: 5.6.24
-- PHP Version: 5.5.24

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `web`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL,
  `parent_category_id` int(11) NOT NULL,
  `title` varchar(50) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `parent_category_id`, `title`, `status`, `created`, `modified`) VALUES
(9, 11, 'sssssss123', 1, '2017-03-26 15:34:01', '0000-00-00 00:00:00'),
(10, 23, 'shyam', 1, '2017-03-26 15:46:52', '0000-00-00 00:00:00'),
(11, 19, 'sssssssssss', 1, '2017-03-26 15:47:36', '0000-00-00 00:00:00'),
(12, 16, 'asasasas', 1, '2017-03-26 15:48:29', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `cms`
--

CREATE TABLE IF NOT EXISTS `cms` (
  `id` int(11) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `description` text,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `cms`
--

INSERT INTO `cms` (`id`, `title`, `description`, `status`, `created`, `modified`) VALUES
(1, 'testsss', '<p>testssssss</p>\n', 1, '2017-05-11 19:09:59', '2017-05-11 13:41:08');

-- --------------------------------------------------------

--
-- Table structure for table `parent_categories`
--

CREATE TABLE IF NOT EXISTS `parent_categories` (
  `id` int(11) NOT NULL,
  `title` varchar(50) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `parent_categories`
--

INSERT INTO `parent_categories` (`id`, `title`, `status`, `created`, `modified`) VALUES
(7, 'test2', 1, '2017-03-26 13:04:04', '0000-00-00 00:00:00'),
(11, 'test1', 1, '2017-03-26 13:04:16', '0000-00-00 00:00:00'),
(16, 'test', 1, '2017-03-26 13:57:43', '0000-00-00 00:00:00'),
(17, 'asasasas', 1, '2017-03-26 13:59:22', '0000-00-00 00:00:00'),
(19, 'test36', 1, '2017-03-26 13:59:28', '0000-00-00 00:00:00'),
(23, 'ram', 1, '2017-03-26 15:45:32', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) unsigned NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(64) NOT NULL,
  `activation_token` varchar(64) DEFAULT NULL,
  `password_reset_token` varchar(64) DEFAULT NULL,
  `role` int(2) NOT NULL DEFAULT '2',
  `otp` varchar(7) DEFAULT NULL,
  `otp_verified` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `profile_pic` varchar(64) DEFAULT NULL,
  `mobile_one` varchar(12) DEFAULT NULL,
  `mobile_two` varchar(12) DEFAULT NULL,
  `first_name` varchar(15) DEFAULT NULL,
  `last_name` varchar(15) DEFAULT NULL,
  `address` text,
  `state` varchar(20) DEFAULT NULL,
  `city` varchar(20) DEFAULT NULL,
  `postcode` int(5) NOT NULL DEFAULT '0',
  `device_type` varchar(10) DEFAULT NULL,
  `device_token` varchar(250) DEFAULT NULL,
  `is_suspend` tinyint(1) NOT NULL DEFAULT '0',
  `is_login` tinyint(1) NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `activation_token`, `password_reset_token`, `role`, `otp`, `otp_verified`, `email_verified`, `profile_pic`, `mobile_one`, `mobile_two`, `first_name`, `last_name`, `address`, `state`, `city`, `postcode`, `device_type`, `device_token`, `is_suspend`, `is_login`, `status`, `is_deleted`, `created`, `modified`) VALUES
(1, 'admin@admin.com', '$2a$10$M4XXL3PC.0wAMW6tfinaJueeS5EV7TQ2Ag1rHJP0H5coRLgdY/PxC', NULL, NULL, 1, NULL, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 1, 0, '2017-03-21 22:29:42', NULL),
(2, 'manmohan@mailinator.com', '$2a$10$5LlOuYPRS8urDY1mZpInTeFRxIU4GSIkyFRSsFy71tBuD8nU5USGC', 'RHgjfx6YrPHGsloLzmwlvpxpOsvm1gtQ', NULL, 2, '6333', 0, 0, NULL, '544545', '45454545', 'test', 'test', NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 1, 0, '2017-05-11 15:45:48', NULL),
(3, 'test@test.com', '$2a$10$ryHm4Lg1s1H0Ag4wc5GQ0.T0AqyGZMgDekMViMz2HF97axz7je0kO', 'LgNzaCvFZ95LT7cCbkAcaAE3VN5hBGph', NULL, 2, '7223', 0, 0, NULL, '787878', '78787878', 'test', 'test', NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 1, 0, '2017-05-11 15:57:02', NULL),
(4, 'manmohanff@mailinator.com', '$2a$10$ENz53y69tORRzNgjhj37EOKWILJcFX5jOwXsr2cF9bruiilc7A4h6', '9eHI0eEIcnd4OdLGu7dcyDdBle6feNOt', NULL, 2, '8643', 0, 0, NULL, '434343', '4343434', 'teste', 'testdddd', NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 1, 0, '2017-05-11 16:28:06', NULL),
(5, 'manmo43han@mailinator.com', '$2a$10$Zf46DDNfLXxLvIgCFLpr3uf47lKtURzIZ2nnvRgQEQrN2ykZ0NDHK', 'J2eIgVpe9l4yaOLI5ZB3kf76bdazlPMw', NULL, 2, '8437', 0, 0, NULL, '44344', '4444', 'testsss', 'testsss', NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 1, 0, '2017-05-11 16:28:49', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cms`
--
ALTER TABLE `cms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `parent_categories`
--
ALTER TABLE `parent_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=13;
--
-- AUTO_INCREMENT for table `cms`
--
ALTER TABLE `cms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `parent_categories`
--
ALTER TABLE `parent_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=24;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=6;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
