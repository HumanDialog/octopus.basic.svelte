
const octopusTestUsers = [
    {
        username: "alice@example.com",
        role: 'supervisor',
        groupId: 13
    },
    {
        username: "bob@example.com",
        role: 'supervisor',
        groupId: 13
    }
]

const hdTestUsers = [
    {
        username: "aga@humandialog.com.pl",
        role: 'GroupOwner',
        groupId: 1
    },
    {
        username: "akr@humandialog.com.pl",
        role: 'supervisor',
        groupId: 1
    }
]

const tilosTestUsers = [
    //{ username: "alice@example.com",      role: "supervisor", groupId: 11   },
    //{ username: "bob@example.com",        role: "supervisor", groupId: 11   },
    { username: "emma@example.com",       role: "GroupOwner", groupId: 13   },
    { username: "jack@example.com",       role: "GroupMember", groupId: 13   },
    { username: "olivia@example.com",     role: "GroupMember", groupId: 13   },
    { username: "liam@example.com",       role: "GroupMember", groupId: 13   },
    { username: "ava@example.com",        role: "GroupMember", groupId: 13   },
    { username: "noah@example.com",       role: "GroupMember", groupId: 13   },
    { username: "mia@example.com",        role: "GroupMember", groupId: 13   },
    { username: "ethan@example.com",      role: "GroupMember", groupId: 13   },
    { username: "lily@example.com",       role: "GroupMember", groupId: 13   },
    { username: "mason@example.com",      role: "GroupMember", groupId: 13   }
]

function getAppUsers(setName)
{
    switch(setName)
    {
    case 'octopus':
        return octopusTestUsers;

    case 'hd':
        return hdTestUsers;

    case 'tilos':
        return tilosTestUsers;
    }
}

export const appUsers = getAppUsers(__USERS_SET__)
