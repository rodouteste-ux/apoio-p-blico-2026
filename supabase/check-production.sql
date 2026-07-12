select id, nome, ativo
from responsaveis;

select id, nome, cargo, ativo, ordem
from pre_candidatos
order by ordem;

select id, user_id, email, role, ativo
from admin_users;
