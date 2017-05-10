-- phpMyAdmin SQL Dump
-- version 4.1.12
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: May 10, 2017 at 05:53 PM
-- Server version: 5.6.16
-- PHP Version: 5.5.11

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
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_category_id` int(11) NOT NULL,
  `title` varchar(50) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=13 ;

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
-- Table structure for table `parent_categories`
--

CREATE TABLE IF NOT EXISTS `parent_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=24 ;

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
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(50) NOT NULL,
  `password` varchar(64) NOT NULL,
  `activation_token` varchar(64) DEFAULT NULL,
  `password_reset_token` varchar(64) DEFAULT NULL,
  `role` int(2) NOT NULL DEFAULT '2',
  `otp` varchar(7) DEFAULT NULL,
  `otp_verified` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `profile_pic` varchar(64) DEFAULT NULL,
  `mobile` varchar(12) DEFAULT NULL,
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
  `modified` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `activation_token`, `password_reset_token`, `role`, `otp`, `otp_verified`, `email_verified`, `profile_pic`, `mobile`, `first_name`, `last_name`, `address`, `state`, `city`, `postcode`, `device_type`, `device_token`, `is_suspend`, `is_login`, `status`, `is_deleted`, `created`, `modified`) VALUES
(1, 'admin@admin.com', '$2a$10$M4XXL3PC.0wAMW6tfinaJueeS5EV7TQ2Ag1rHJP0H5coRLgdY/PxC', NULL, NULL, 1, NULL, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 1, 0, '2017-03-21 22:29:42', NULL);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
