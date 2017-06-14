#!/bin/sh
#Make sure we use InnoDB Barracuda format and file_per_table
echo 'SET GLOBAL innodb_file_format=Barracuda;' > chamsocial-schema.sql
echo 'SET GLOBAL innodb_file_per_table=1;' >> chamsocial-schema.sql

#Dump the MySQL schema without data or auto-increment values
mysqldump --opt chamsocial -d --single-transaction | sed 's/ AUTO_INCREMENT=[0-9]*//' >> chamsocial-schema.sql
