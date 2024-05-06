# Functions of this module

0. [x] Create new customer

1. [x] message customers
   - [x] create message table on db
   - [x] create /draft-message-to-customer endpoint
   - [x] this endpoint will expect the following:
             1. subject
             2. text
             3. optional attachments
             4. recipient
             5. sender (for configuration purposes of nodemailer)
             6. (look into cost) implement ai sprucing of the message at the end, and then have it present an alternate suggested message. 
    - [x] on successful posting of the message, you will recieve the original message with a prompting to have ai improve the message with the next endpoint (optional)
    - [x] create /ai-message-recommendation endpoint that uses ai to enhance the message. (optional)
    - [x] on success of everything, there will be a /send-customer-message post endpoint to send final message to customer. 
2. [ ] view messages with customers
3. [ ] view past projects with customers
4. [ ] view current projects with customers
5. [ ] update past project details
6. [ ] update current projects with customers
7. [ ] view customer's contact information
8. [ ] view expenses from project's with customers
9. [ ] view revenue from customer project's
10. [ ] view documentation (receipts, forms)
11. [ ] add upload documentation feature
12. [ ] view customer's payment history (late, derelict, on time);
13. [ ] view automations with customers
14. [ ] build, update, or delete automations with customer.
