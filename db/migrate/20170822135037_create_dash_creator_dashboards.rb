class CreateDashCreatorDashboards < ActiveRecord::Migration[5.1]
  def change
    if extension_enabled?('pgcrypto') && DashCreator.use_pgcrypto
      create_table :dash_creator_dashboards, id: :uuid, default: 'gen_random_uuid()' do |t|
        t.uuid :user_id

        t.jsonb :options
        t.string :name

        t.timestamps
      end

    else
      create_table :dash_creator_dashboards do |t|
        t.id :user_id

        t.jsonb :options
        t.string :name

        t.timestamps
      end
    end
  end

  def self.down
    drop_table :dash_creator_dashboards
  end
end
